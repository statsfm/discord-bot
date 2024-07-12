const todayRange = {
  name: 'Today',
  value: 'today'
} as const;

const fourWeeksRange = {
  name: '4 weeks',
  value: '4-weeks'
} as const;

const sixMonthsRange = {
  name: '6 months',
  value: '6-months'
} as const;

const lifetimeRange = {
  name: 'Lifetime',
  value: 'lifetime'
} as const;

export const rangeChoices = <IncludeToday extends boolean = false>(
  includeToday: IncludeToday = false as IncludeToday
): IncludeToday extends true
  ? [typeof todayRange, typeof fourWeeksRange, typeof sixMonthsRange, typeof lifetimeRange]
  : [typeof fourWeeksRange, typeof sixMonthsRange, typeof lifetimeRange] => {
  return (
    includeToday
      ? [todayRange, fourWeeksRange, sixMonthsRange, lifetimeRange]
      : [fourWeeksRange, sixMonthsRange, lifetimeRange]
  ) as ReturnType<typeof rangeChoices<IncludeToday>>;
};
