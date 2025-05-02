export function formatRelevativeTime(date: Date) {
  const now = new Date();
  // convert milliseconds to seconds to minutes to hours to days
  const diffInDays = Math.floor(
    (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24) // we do not want milliseconds, so we divide
  );

  if (diffInDays === 0) {
    return 'Posted today';
  } else if (diffInDays === 1) {
    return 'Posted 1 day ago';
  } else {
    return `Posted ${diffInDays} days ago`;
  }
}
