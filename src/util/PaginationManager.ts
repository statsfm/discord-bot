import {
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  InteractionReplyOptions,
  InteractionUpdateOptions,
  Message,
  User,
} from 'discord.js';
import { container } from 'tsyringe';
import { Analytics } from './Analytics';
const analytics = container.resolve(Analytics);

export const createPaginationManager = <T>(
  data: T[],
  embedCreator: EmbedCreatorFunction<T>,
  amountPerPage = 10
): PaginationManager<T> =>
  new PaginationManager<T>(data, embedCreator, amountPerPage);

type PaginationComponentType<T extends string = string> =
  | `${T}|first_page`
  | `${T}|previous_page`
  | `${T}|next_page`
  | `${T}|last_page`
  | `${T}|stop`;

export const createPaginationComponentTypes = <T extends string>(
  identificator: T
) => {
  return {
    FIRST_PAGE: `${identificator}|first_page`,
    PREVIOUS_PAGE: `${identificator}|previous_page`,
    NEXT_PAGE: `${identificator}|next_page`,
    LAST_PAGE: `${identificator}|last_page`,
    STOP: `${identificator}|stop`,
  } as const;
};

export const createPaginationButtonComponent = (
  type: PaginationComponentType,
  disabled = false
) => {
  let label = '';
  if (type.endsWith('first_page')) label = 'First';
  else if (type.endsWith('previous_page')) label = 'Previous';
  else if (type.endsWith('next_page')) label = 'Next';
  else if (type.endsWith('last_page')) label = 'Last';
  else if (type.endsWith('stop')) label = 'Stop';
  const button = new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setCustomId(type)
    .setDisabled(disabled)
    .setLabel(label);
  if (type.endsWith('stop')) button.setStyle(ButtonStyle.Danger);
  return button;
};

export class PaginationManager<T> {
  public totalPages: number;
  public currentPage = 1;
  private privateSplittedData: T[][];
  constructor(
    private data: T[],
    private embedCreator: EmbedCreatorFunction<T>,
    public amountPerPage = 10
  ) {
    if (this.amountPerPage > this.data.length) this.amountPerPage = data.length;
    this.totalPages = Math.ceil(this.data.length / this.amountPerPage);
    this.privateSplittedData = this.splitData();
  }

  private splitData(): T[][] {
    const splittedData: T[][] = [];
    for (let i = 0; i < this.data.length; i += this.amountPerPage) {
      splittedData.push(this.data.slice(i, i + this.amountPerPage));
    }
    return splittedData;
  }

  current() {
    const currentData = this.privateSplittedData[this.currentPage - 1] ?? [];
    return this.embedCreator(this.currentPage, this.totalPages, currentData);
  }

  next() {
    this.currentPage++;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    return this.current();
  }

  previous() {
    this.currentPage--;
    if (this.currentPage < 1) this.currentPage = 1;
    return this.current();
  }

  hasPrevious() {
    return this.currentPage > 1;
  }

  hasNext() {
    return this.currentPage < this.totalPages;
  }

  first() {
    this.currentPage = 1;
    return this.current();
  }

  last() {
    this.currentPage = this.totalPages;
    return this.current();
  }

  goToPage(page: number) {
    if (page < 1) page = 1;
    if (page > this.totalPages) page = this.totalPages;
    this.currentPage = page;
    return this.current();
  }

  isFirst() {
    return this.currentPage === 1;
  }

  isLast() {
    return this.currentPage === this.totalPages;
  }

  createMessage<ReplyOrUpdate extends 'reply' | 'update'>(
    pageEmbed: EmbedBuilder,
    componentTypes: ReturnType<typeof createPaginationComponentTypes>
  ): ReplyOrUpdate extends 'reply'
    ? InteractionReplyOptions
    : InteractionUpdateOptions {
    return {
      embeds: [pageEmbed],
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            createPaginationButtonComponent(
              componentTypes.FIRST_PAGE,
              this.isFirst()
            ),
            createPaginationButtonComponent(
              componentTypes.PREVIOUS_PAGE,
              !this.hasPrevious()
            ),
            createPaginationButtonComponent(
              componentTypes.NEXT_PAGE,
              !this.hasNext()
            ),
            createPaginationButtonComponent(
              componentTypes.LAST_PAGE,
              this.isLast()
            ),
            createPaginationButtonComponent(componentTypes.STOP),
          ],
        },
      ],
    };
  }

  private analyticsFormatter(customId: string): string {
    const splittedCustomId = customId.split('|');
    return `${splittedCustomId[0].toUpperCase().replace(/-/g, '_')}_${
      splittedCustomId[1]
    }`;
  }

  manageCollector(
    message: Message<boolean>,
    componentTypes: ReturnType<typeof createPaginationComponentTypes>,
    interactionUser: User
  ) {
    const collector =
      message.createMessageComponentCollector<ComponentType.Button>({
        filter: (buttonInteraction) => {
          return [
            componentTypes.FIRST_PAGE,
            componentTypes.PREVIOUS_PAGE,
            componentTypes.NEXT_PAGE,
            componentTypes.LAST_PAGE,
            componentTypes.STOP,
          ].includes(
            buttonInteraction.customId as (typeof componentTypes)[keyof typeof componentTypes]
          );
        },
        // 5 minutes
        time: 5 * 60 * 1_000,
      });

    collector.on('collect', async (buttonInteraction) => {
      analytics.track(this.analyticsFormatter(buttonInteraction.customId));

      if (buttonInteraction.user.id !== interactionUser.id) {
        await buttonInteraction.reply({
          content: 'You cannot use this button.',
          ephemeral: true,
        });
      } else if (buttonInteraction.customId === componentTypes.NEXT_PAGE) {
        await buttonInteraction.update(
          this.createMessage<'update'>(await this.next(), componentTypes)
        );
      } else if (buttonInteraction.customId === componentTypes.PREVIOUS_PAGE) {
        await buttonInteraction.update(
          this.createMessage<'update'>(await this.previous(), componentTypes)
        );
      } else if (buttonInteraction.customId === componentTypes.FIRST_PAGE) {
        await buttonInteraction.update(
          this.createMessage<'update'>(await this.first(), componentTypes)
        );
      } else if (buttonInteraction.customId === componentTypes.LAST_PAGE) {
        await buttonInteraction.update(
          this.createMessage<'update'>(await this.last(), componentTypes)
        );
      } else if (buttonInteraction.customId === componentTypes.STOP) {
        collector.stop();
      }
    });

    collector.on('end', async (buttonInteractions) => {
      const lastInteraction = buttonInteractions.last();
      if (lastInteraction) {
        const message = await lastInteraction.fetchReply();
        await message.edit({
          embeds: [await this.current()],
          components: [],
        });
      }
    });
  }
}

type EmbedCreatorFunction<T> = (
  currPage: number,
  totalPages: number,
  data: T[]
) => Awaitable<EmbedBuilder>;
