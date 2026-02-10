const PAN_LIKE = /(pan|vat|invoice|bill no|tax|tel|phone)/i;
const DATE_PATTERNS = [
  /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
  /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/,
];

const normalizeAmount = (raw) => Number(String(raw).replace(/[,\s]/g, ''));

const findAmounts = (lines) => {
  const candidates = [];

  lines.forEach((line, index) => {
    const matches = line.match(/(?:rs\.?|npr|रू)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})|\d+(?:\.\d{1,2}))/gi) || [];
    matches.forEach((token) => {
      const numericMatch = token.match(/\d[\d,.]*/);
      if (!numericMatch) return;
      const value = normalizeAmount(numericMatch[0]);
      if (Number.isNaN(value)) return;
      if (value < 1 || value > 500000) return;
      if (/\d{7,}/.test(numericMatch[0])) return;

      const keywordBoost = /(total|net payable|grand total|amount due|paid|payment)/i.test(line);
      candidates.push({ value, index, keywordBoost });
    });
  });

  candidates.sort((a, b) => {
    if (a.keywordBoost !== b.keywordBoost) {
      return a.keywordBoost ? -1 : 1;
    }
    return b.value - a.value;
  });

  return candidates;
};

const findDate = (lines) => {
  for (const line of lines) {
    for (const pattern of DATE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const [token] = match;
        const parsed = new Date(token);
        if (!Number.isNaN(parsed.valueOf())) {
          return { value: parsed.toISOString().slice(0, 10), confidence: 0.8 };
        }
      }
    }
  }

  return { value: new Date().toISOString().slice(0, 10), confidence: 0.35 };
};

const findMerchant = (lines) => {
  const cleaned = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 2)
    .filter((line) => !PAN_LIKE.test(line))
    .slice(0, 6);

  const merchant = cleaned.find((line) => !/\d{4,}/.test(line)) || cleaned[0] || '';
  return {
    value: merchant,
    confidence: merchant ? 0.7 : 0.25,
  };
};

export const extractExpenseGist = ({ fullText = '', lines = [] }) => {
  const normalizedLines = (lines.length ? lines : fullText.split('\n')).map((line) => line.trim()).filter(Boolean);

  const amountCandidates = findAmounts(normalizedLines);
  const amount = amountCandidates[0];

  const date = findDate(normalizedLines);
  const merchant = findMerchant(normalizedLines);

  const confidence = amount?.keywordBoost ? 0.92 : amount ? 0.62 : 0.18;

  return {
    amount: amount?.value?.toFixed(2) || '',
    date: date.value,
    merchant: merchant.value,
    ocrText: fullText,
    confidence,
    fieldConfidence: {
      amount: amount?.keywordBoost ? 'high' : amount ? 'medium' : 'low',
      date: date.confidence >= 0.7 ? 'high' : 'low',
      merchant: merchant.confidence >= 0.65 ? 'medium' : 'low',
    },
  };
};
