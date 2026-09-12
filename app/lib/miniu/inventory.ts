export type InventoryItemRow = {
  id: string;
  user_id: string;
  suggestion_id: string | null;
  item_name: string;
  asset_key: string;
  equipped: boolean;
  deleted_at: string | null;
  purge_after: string | null;
  created_at: string;
};

export type ItemSuggestionRow = {
  id: string;
  user_id: string;
  keyword: string;
  item_name: string;
  status: "pending" | "accepted" | "rejected";
  deleted_at: string | null;
  purge_after: string | null;
  created_at: string;
  decided_at: string | null;
};

export type ItemCandidate = {
  keyword: string;
  itemName: string;
  assetKey: string;
};

const itemCandidates: ItemCandidate[] = [
  { keyword: "커피", itemName: "테이크아웃 커피", assetKey: "item-coffee-cup" },
  { keyword: "아메리카노", itemName: "아이스 아메리카노", assetKey: "item-iced-americano" },
  { keyword: "야구", itemName: "야구 모자", assetKey: "item-baseball-cap" },
  { keyword: "기타", itemName: "기타", assetKey: "item-guitar" },
  { keyword: "책", itemName: "작은 책", assetKey: "item-book" },
  { keyword: "꽃", itemName: "작은 꽃다발", assetKey: "item-flower-bouquet" },
  { keyword: "목걸이", itemName: "목걸이", assetKey: "item-necklace" },
  { keyword: "반지", itemName: "반지", assetKey: "item-ring" },
  { keyword: "초콜릿", itemName: "초콜릿", assetKey: "item-chocolate" },
  { keyword: "고양이", itemName: "고양이 인형", assetKey: "item-cat-doll" },
];

export function toInventoryItem(row: InventoryItemRow) {
  return {
    id: row.id,
    userId: row.user_id,
    suggestionId: row.suggestion_id,
    name: row.item_name,
    assetKey: row.asset_key,
    equipped: row.equipped,
    createdAt: row.created_at,
  };
}

export function toItemSuggestion(row: ItemSuggestionRow) {
  return {
    id: row.id,
    userId: row.user_id,
    keyword: row.keyword,
    itemName: row.item_name,
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

export function assetKeyForKeyword(keyword: string): string {
  return itemCandidates.find((candidate) => candidate.keyword === keyword)?.assetKey ?? `item-${keyword.toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-")}`;
}

export function buildItemCandidates(texts: string[]): ItemCandidate[] {
  const joinedText = texts.join("\n").toLowerCase();
  return itemCandidates.filter((candidate) => countKeyword(joinedText, candidate.keyword.toLowerCase()) >= 2);
}

function countKeyword(text: string, keyword: string): number {
  let count = 0;
  let index = text.indexOf(keyword);
  while (index >= 0) {
    count += 1;
    index = text.indexOf(keyword, index + keyword.length);
  }
  return count;
}
