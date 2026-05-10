export const extractYouTubeId = (urlOrText: string): string | null => {
  if (!urlOrText) return null;

  // Regular expression to match various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
  
  // Extract URLs from text if the input is a full string containing a URL
  const urlMatch = urlOrText.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi);
  
  const textToParse = urlMatch ? urlMatch[0] : urlOrText;
  
  const match = textToParse.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }
  
  return null;
};
