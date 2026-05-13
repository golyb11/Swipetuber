export const extractYouTubeId = (urlOrText: string): string | null => {
  if (!urlOrText) return null;


  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
  

  const urlMatch = urlOrText.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&
  
  const textToParse = urlMatch ? urlMatch[0] : urlOrText;
  
  const match = textToParse.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }
  
  return null;
};
