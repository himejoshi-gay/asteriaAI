export function buildCustomId(
  prefix: string,
  userId: string,
  ctx: {
    dataStoreId?: string | undefined;
    data?: string[] | undefined;
  },
): string {
  const result = `${prefix}:${userId}:${ctx.dataStoreId}:${ctx.data?.join(",") ?? ""}`;
  if (result.length > 100) {
    throw new Error("Custom IDs can only have a maximum length of 100");
  }

  return result;
}

export function parseCustomId(customId: string) {
  const { 0: prefix, 1: userId, 2: dataStoreId, 3: data } = customId.split(":");
  if (!prefix || !userId) {
    throw new Error("Couldn't parse custom ID: No prefix or userId");
  }

  return {
    prefix,
    userId,
    ctx: {
      dataStoreId,
      data,
    },
  };
}
