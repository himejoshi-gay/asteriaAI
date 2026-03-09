export async function tryToGetImage(imageUrl: string, placeholderUrl?: string) {
  const haveAccess = await checkIfAccess(imageUrl);
  if (haveAccess?.status !== 200) {
    return (
      placeholderUrl
      ?? `https://github.com/SunriseCommunity/Sunset/blob/main/public/images/metadata.png?raw=true`
    );
  }

  return imageUrl;
}

async function checkIfAccess(url: string) {
  try {
    const check = await fetch(url);
    return check;
  }
  catch {
  //  ignore, return undefined
  }
}
