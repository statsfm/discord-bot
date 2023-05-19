export function getDuration(duration: number, noBold = false) {
  const data = [];
  duration /= 1000;

  const hour = Math.floor((duration / 60 / 60) % 24);
  const min = Math.floor((duration / 60) % 60);
  const sec = Math.floor(duration % 60);
  if (sec >= 1) data.push(`**${sec}** second${sec > 1 ? 's' : ''}`);
  if (min >= 1) data.push(`**${min}** minute${min > 1 ? 's' : ''}`);
  if (hour >= 1) data.push(`**${hour}** hour${hour > 1 ? 's' : ''}`);

  duration /= 60 * 60 * 24;

  const days = Math.floor(((duration % 365) % 30) % 7);
  const week = Math.floor(((duration % 365) % 30) / 7);
  const dayPlural = days > 1 ? 's' : '';
  const weekPlural = week > 1 ? 's' : '';
  if (days >= 1) data.push(`**${days}** day${dayPlural}`);
  if (week >= 1) data.push(`**${week}** week${weekPlural}`);

  if (duration >= 27) {
    return durationMonthOrHigher(duration);
  }
  const reversedData = [...data].reverse();
  const readyData = `${reversedData.slice(0, 2).join(' and ')}`;
  if (noBold) return readyData.replace(/\*\*/g, '');
  return readyData;
}

function durationMonthOrHigher(duration: number) {
  if (duration < 46) return `a month`;
  else if (duration < 320) return `${Math.round(duration / 30)} months`;
  else if (duration < 548) return `a year`;
  return `${Math.round(duration / 365)} years`;
}
