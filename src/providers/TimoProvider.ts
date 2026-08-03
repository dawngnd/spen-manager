import { EmailProvider, ParsedTransaction, TransactionType } from './EmailProvider';

export const TimoProvider: EmailProvider = {
  name: 'Timo',
  
  match: (subject: string, from: string): boolean => {
    // Check if the email is from Timo
    if (!from.toLowerCase().includes('timo.vn')) {
      return false;
    }
    
    // Check for typical subject keywords
    const lowerSubject = subject.toLowerCase();
    return lowerSubject.includes('biến động số dư') || 
           lowerSubject.includes('giao dịch') || 
           lowerSubject.includes('balance notification');
  },
  
  parse: (body: string, subject: string): ParsedTransaction | null => {
    try {
      // Clean up body by removing HTML tags if any, to make parsing easier
      const cleanBody = body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ');

      // 1. Extract Amount and Type
      // Look for something like: Số tiền giao dịch: + 1,000,000 VND or - 500,000 VND
      // Or: Số tiền / Amount: +1,000,000 VND
      let amountRegex = /(?:\+|\-)\s*[\d,.]+/g;
      const amountMatches = cleanBody.match(amountRegex);
      
      let amount = 0;
      let type: TransactionType = 'expense';
      
      if (amountMatches && amountMatches.length > 0) {
        const amountStr = amountMatches[0].replace(/,/g, '').replace(/\./g, '').replace(/\s/g, '');
        if (amountStr.startsWith('+')) {
          type = 'income';
        }
        amount = parseInt(amountStr.replace(/[+-]/, ''), 10);
      } else {
        // Fallback amount parsing if no +/- is found
        const fallbackAmountRegex = /(?:Số tiền|Amount).*?([\d,.]+)\s*(?:VND|VNĐ)/i;
        const fallbackMatch = cleanBody.match(fallbackAmountRegex);
        if (fallbackMatch && fallbackMatch[1]) {
          amount = parseInt(fallbackMatch[1].replace(/,/g, '').replace(/\./g, ''), 10);
          // Guess type based on subject or body keywords if +/- not present
          if (cleanBody.toLowerCase().includes('nhận tiền') || cleanBody.toLowerCase().includes('credited')) {
            type = 'income';
          }
        }
      }

      if (!amount) {
        return null; // Cannot parse without amount
      }

      // 2. Extract Date
      // Look for: Ngày giao dịch / Date: 12/10/2023 15:30:00
      let date = new Date(); // default to now
      const dateRegex = /(?:Ngày giao dịch|Ngày|Thời gian|Date|Time).*?(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4})/i;
      const dateMatch = cleanBody.match(dateRegex);
      if (dateMatch && dateMatch[1]) {
        // Simple parse assuming DD/MM/YYYY
        const dateStr = dateMatch[1];
        const parts = dateStr.split(/[\/\s:]/);
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          let hours = 0, minutes = 0, seconds = 0;
          if (parts.length >= 6) {
            hours = parseInt(parts[3], 10);
            minutes = parseInt(parts[4], 10);
            seconds = parseInt(parts[5], 10);
          }
          date = new Date(year, month, day, hours, minutes, seconds);
        }
      }

      // 3. Extract Merchant / Reference
      // Look for: Nội dung / Details: ... or Thông tin giao dịch: ...
      let reference = 'Timo Transaction';
      let merchant = '';
      
      const refRegex = /(?:Nội dung|Thông tin|Details|Description|Nội dung giao dịch).*?:(.*?)(?:Số dư|Balance|Mã giao dịch|$)/i;
      const refMatch = cleanBody.match(refRegex);
      if (refMatch && refMatch[1]) {
        reference = refMatch[1].trim();
      }
      
      // Try to extract a sensible merchant from the reference
      if (reference) {
        // Some simple heuristics for merchant extraction if it's a transfer
        if (reference.toLowerCase().includes('chuyen tien')) {
          type = 'transfer';
        }
        merchant = reference.substring(0, 50); // limit length
      } else {
        merchant = type === 'income' ? 'Income' : 'Expense';
      }

      return {
        amount,
        type,
        merchant,
        date,
        reference
      };
    } catch (e) {
      console.error('Error parsing Timo email:', e);
      return null;
    }
  }
};
