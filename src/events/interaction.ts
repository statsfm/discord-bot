import type { Cluster } from "@cordis/gateway";
import type { Rest } from "@cordis/rest";
import {
  APIApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponseChannelMessageWithSource,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  ApplicationCommandType,
  GatewayDispatchEvents,
  GatewayInteractionCreateDispatch,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIInteractionCallbackJSONBody,
  Routes,
} from "discord-api-types/v9";
import { inject, injectable } from "tsyringe";
import type { ICommand } from "../util/Command";
import { Config } from "../util/Config";
import type { IEvent } from "../util/Event";
import { transformInteraction } from "../util/InteractionOptions";
import type { Logger } from "../util/Logger";
import { kCommands, kGateway, kLogger, kRest } from "../util/tokens";

@injectable()
export default class implements IEvent {
  public name = "Interaction handling";

  private readonly replied = new Set<string>();

  public constructor(
    public readonly config: Config,
    @inject(kGateway) public readonly gateway: Cluster,
    @inject(kCommands) public readonly commands: Map<string, ICommand>,
    @inject(kRest) public readonly rest: Rest,
    @inject(kLogger) public readonly logger: Logger
  ) {}

  public execute(): void {
    this.gateway.on("dispatch", (payload) => {
      console.log(payload.t);
      // @ts-expect-error - Miss matched discord-api-types versions
      if (payload.t !== GatewayDispatchEvents.InteractionCreate) return;

      const interaction = (payload as GatewayInteractionCreateDispatch)
        .d as APIInteraction;

      // console.log(interaction);

      try {
        switch (interaction.type) {
          case InteractionType.ApplicationCommand:
            return this.handleCommand(interaction);
          case InteractionType.MessageComponent:
            return this.handleComponent(interaction);
          case InteractionType.ModalSubmit:
            return this.handleModal(interaction);
          default:
            this.logger.error("Uncaught error while handling interaction");
            return this.respond(interaction, {
              type: InteractionResponseType.ChannelMessageWithSource,
              data: {
                content:
                  "Something went wrong while handling this interaction - please mail us at support@stats.fm if you see this with steps on how to reproduce",
                flags: MessageFlags.Ephemeral,
              },
            });
        }
      } catch (error) {
        this.logger.error(
          "Uncaught error while handling interaction",
          error as string
        );
        return this.respond(interaction, {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content:
              "Something went wrong while handling this interaction - please mail us at support@stats.fm if you see this with steps on how to reproduce",
            flags: MessageFlags.Ephemeral,
          },
        });
      }
    });
  }

  public async handleCommand(interaction: APIApplicationCommandInteraction) {
    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
      this.logger.warn(
        "Got interaction with non-chat input command",
        JSON.stringify(interaction, null, 2)
      );
      return this.respond(interaction, {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content:
            "This command is a non-chat input command - if you somehow managed to get this error, please modmail us on how",
          flags: MessageFlags.Ephemeral,
        },
      });
    }

    const command = this.commands.get(interaction.data.name.toLowerCase());
    if (!command) return;
    try {
      // TODO: Store command stats
      // Check if command is guild locked
      if (command.guilds && command.guilds.length > 0 && interaction.guild_id) {
        if (!command.guilds.includes(interaction.guild_id))
          return this.respond(interaction, {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: "This command is not available in this guild!",
              flags: MessageFlags.Ephemeral,
            },
          });
      }
      await command.execute(
        interaction,
        transformInteraction(
          interaction.data.options,
          interaction.data.resolved
        ),
        this.respond.bind(this)
      );
    } catch (error) {}
  }

  public handleComponent(interaction: APIMessageComponentInteraction) {
    interaction = interaction;
  }

  public handleModal(interaction: APIModalSubmitInteraction) {
    interaction = interaction;
  }

  public async respond(
    interaction: APIInteraction,
    data: RESTPostAPIInteractionCallbackJSONBody
  ) {
    if (this.replied.has(interaction.token)) {
      return this.rest.patch<
        unknown,
        RESTPatchAPIWebhookWithTokenMessageJSONBody
      >(
        Routes.webhookMessage(
          this.config.discordClientId,
          interaction.token,
          "@original"
        ),
        {
          data: (data as APIInteractionResponseChannelMessageWithSource).data,
        }
      );
    }

    this.replied.add(interaction.token);
    setTimeout(() => this.replied.delete(interaction.token), 6e4).unref();

    return this.rest.post<unknown, RESTPostAPIInteractionCallbackJSONBody>(
      Routes.interactionCallback(interaction.id, interaction.token),
      {
        data,
      }
    );
  }
}
