const TIME_RESPONSE_ITA = {
    year: " Anni fa",
    month: " Mesi fa",
    day: " Giorni fa",
    hour: " Ore fa",
    minute: " Minuti fa",
    second: " Secondi fa"
};

export function timeSince(date:Date) {
    const seconds = Math.floor((new Date() as any - (date as any)) / 1000);
    let interval = seconds / 31536000;
  
    if (interval > 1) {
      return Math.floor(interval) + TIME_RESPONSE_ITA.year;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + TIME_RESPONSE_ITA.month;
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + TIME_RESPONSE_ITA.day;
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + TIME_RESPONSE_ITA.hour;
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + TIME_RESPONSE_ITA.minute;
    }
    return Math.floor(seconds) + TIME_RESPONSE_ITA.second;
}