export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  balanceAfter: number;
  confidence: number;
}

export function parseTransactionText(text: string): ParsedTransaction {
  let date: Date | null = null;
  let amount: number | null = null;
  let balanceAfter: number | null = null;
  let description = "";
  let confidence = 0;

  // 1. Parse Date
  // Match Date formats:
  // a) DD MMM YYYY (e.g., 11 Dec 2025)
  // b) MM/DD/YYYY or DD/MM/YYYY (e.g., 12/11/2025)
  // c) YYYY-MM-DD (e.g., 2025-12-10)
  const ddMmmYyyyRegex = /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/;
  const slashDateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const yyyyMmDdRegex = /(\d{4})-(\d{2})-(\d{2})/;

  let dateMatch = text.match(ddMmmYyyyRegex);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const monthStr = dateMatch[2];
    const year = parseInt(dateMatch[3]);
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = months[monthStr.toLowerCase().substring(0, 3)];
    if (month !== undefined) {
      date = new Date(Date.UTC(year, month, day));
    }
  } else {
    dateMatch = text.match(yyyyMmDdRegex);
    if (dateMatch) {
      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const day = parseInt(dateMatch[3]);
      date = new Date(Date.UTC(year, month, day));
    } else {
      dateMatch = text.match(slashDateRegex);
      if (dateMatch) {
        const first = parseInt(dateMatch[1]);
        const second = parseInt(dateMatch[2]);
        const year = parseInt(dateMatch[3]);
        // Simple heuristic: if first number is > 12, it is the day (DD/MM/YYYY)
        if (first > 12) {
          date = new Date(Date.UTC(year, second - 1, first));
        } else {
          // Default: assume DD/MM/YYYY for standard context (can be adjusted as needed)
          date = new Date(Date.UTC(year, second - 1, first));
        }
      }
    }
  }

  // 2. Parse Amounts & Balance
  const amountPattern = /(?:₹|Rs\.?|\$)?\s*(-?[\d,]+\.\d{2})/g;
  const matches = [...text.matchAll(amountPattern)];

  // Look for Balance keyword and capture the balance
  const balanceLabelRegex = /(?:balance|bal|balanceafter|balafter)\s*(?:₹|Rs\.?|\$)?\s*(-?[\d,]+\.\d{2})/i;
  const balanceLabelMatch = text.match(balanceLabelRegex);
  if (balanceLabelMatch) {
    balanceAfter = parseFloat(balanceLabelMatch[1].replace(/,/g, ""));
  }

  let rawAmountValue: number | null = null;
  let isDebit = false;
  let isCredit = false;

  // Debit/Credit detection patterns
  const debitedRegex = /(?:₹|Rs\.?|\$)?\s*([\d,]+\.\d{2})\s*(?:debited|debit|Dr)/i;
  const creditedRegex = /(?:₹|Rs\.?|\$)?\s*([\d,]+\.\d{2})\s*(?:credited|credit|Cr)/i;
  const negativeRegex = /-\s*(?:₹|Rs\.?|\$)?\s*([\d,]+\.\d{2})/i;

  const debitedMatch = text.match(debitedRegex);
  const creditedMatch = text.match(creditedRegex);
  const negativeMatch = text.match(negativeRegex);

  if (debitedMatch) {
    rawAmountValue = parseFloat(debitedMatch[1].replace(/,/g, ""));
    isDebit = true;
  } else if (creditedMatch) {
    rawAmountValue = parseFloat(creditedMatch[1].replace(/,/g, ""));
    isCredit = true;
  } else if (negativeMatch) {
    rawAmountValue = parseFloat(negativeMatch[1].replace(/,/g, ""));
    isDebit = true;
  } else {
    // Fallback: use first amount match
    if (matches.length > 0) {
      const firstVal = parseFloat(matches[0][1].replace(/,/g, ""));
      if (matches[0][0].includes("-") || firstVal < 0) {
        rawAmountValue = Math.abs(firstVal);
        isDebit = true;
      } else {
        rawAmountValue = firstVal;
        isDebit = true; // Default assumption
      }
    }
  }

  if (rawAmountValue !== null) {
    amount = isDebit ? -rawAmountValue : rawAmountValue;
  }

  // If balanceAfter was not found explicitly via "Balance" label, check if we have a second number match
  if (balanceAfter === null && matches.length > 1) {
    // If the first match was used for amount, the second match is likely the balanceAfter
    balanceAfter = parseFloat(matches[1][1].replace(/,/g, ""));
  }

  // 3. Extract Description
  let cleanText = text;
  if (dateMatch) {
    cleanText = cleanText.replace(dateMatch[0], "");
  }
  matches.forEach((m) => {
    cleanText = cleanText.replace(m[0], "");
  });
  // Strip keywords, symbols, and common parsing artifacts
  cleanText = cleanText.replace(/debited|credited|debit|credit|Dr|Cr|balance|bal|balanceafter|balafter/gi, "");
  cleanText = cleanText.replace(/[₹$,\-→>:]/g, "");
  cleanText = cleanText.replace(/\s+/g, " ").trim();
  
  // Remove common field labels and artifacts
  cleanText = cleanText.replace(/^(to|from|transfer|payment|merchant|description)\s*/gi, "");
  
  description = cleanText;

  if (!description) {
    description = "Transaction";
  }

  // 4. Calculate Confidence Score (0.0 to 1.0)
  let fieldsFound = 0;
  if (date !== null) fieldsFound++;
  if (amount !== null) fieldsFound++;
  if (balanceAfter !== null) fieldsFound++;
  if (description !== "Transaction") fieldsFound++;
  confidence = fieldsFound / 4;

  return {
    date: date || new Date(),
    description,
    amount: amount || 0,
    balanceAfter: balanceAfter || 0,
    confidence,
  };
}
