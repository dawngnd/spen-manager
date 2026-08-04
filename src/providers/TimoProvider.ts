import { EmailProvider, ParsedTransaction, TransactionType } from './EmailProvider';

export const TimoProvider: EmailProvider = {
  name: 'Timo',
  
  match: (subject: string, from: string): boolean => {
    if (!from.toLowerCase().includes('timo.vn')) {
      return false;
    }
    const lowerSubject = subject.toLowerCase();
    return lowerSubject.includes('biến động số dư') || 
           lowerSubject.includes('giao dịch') || 
           lowerSubject.includes('balance notification') ||
           lowerSubject.includes('thay đổi số dư');
  },
  
  parse: (body: string, subject: string): ParsedTransaction | null => {
    try {
      const cleanBody = body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ');

      let amount = 0;
      let type: TransactionType = 'expense';
      
      // 1. Amount and Type
      const amountRegex = /(?:\+|\-)\s*[\d,.]+/g;
      const amountMatches = cleanBody.match(amountRegex);
      
      if (amountMatches && amountMatches.length > 0) {
        const amountStr = amountMatches[0].replace(/,/g, '').replace(/\./g, '').replace(/\s/g, '');
        if (amountStr.startsWith('+')) {
          type = 'income';
        }
        amount = parseInt(amountStr.replace(/[+-]/, ''), 10);
      } else {
        // Fallback for "tăng 10.000 VND" or "giảm 10.000 VND"
        const tangGiamRegex = /(tăng|giảm)\s*([\d,.]+)\s*(?:VND|VNĐ)/i;
        const tangGiamMatch = cleanBody.match(tangGiamRegex);
        if (tangGiamMatch && tangGiamMatch[2]) {
          type = tangGiamMatch[1].toLowerCase() === 'tăng' ? 'income' : 'expense';
          amount = parseInt(tangGiamMatch[2].replace(/,/g, '').replace(/\./g, ''), 10);
        } else {
          const fallbackAmountRegex = /(?:Số tiền|Amount).*?([\d,.]+)\s*(?:VND|VNĐ)/i;
          const fallbackMatch = cleanBody.match(fallbackAmountRegex);
          if (fallbackMatch && fallbackMatch[1]) {
            amount = parseInt(fallbackMatch[1].replace(/,/g, '').replace(/\./g, ''), 10);
            if (cleanBody.toLowerCase().includes('nhận tiền') || cleanBody.toLowerCase().includes('credited')) {
              type = 'income';
            }
          }
        }
      }

      if (!amount) return null;

      // 2. Date
      let date = new Date();
      // Supports "vào 04/08/2026 07:38" or standard date formats
      const dateRegex = /(?:Ngày giao dịch|Ngày|Thời gian|Date|Time|vào).*?(\d{2}\/\d{2}\/\d{4}(?: \d{2}:\d{2}(?::\d{2})?)?)/i;
      const dateMatch = cleanBody.match(dateRegex);
      if (dateMatch && dateMatch[1]) {
        const dateStr = dateMatch[1];
        const parts = dateStr.split(/[\/\s:]/);
        if (parts.length >= 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          let hours = 0, minutes = 0, seconds = 0;
          if (parts.length >= 5) {
            hours = parseInt(parts[3], 10);
            minutes = parseInt(parts[4], 10);
          }
          if (parts.length >= 6) {
            seconds = parseInt(parts[5], 10);
          }
          date = new Date(year, month, day, hours, minutes, seconds);
        }
      }

      // 3. Merchant / Reference
      let reference = 'Timo Transaction';
      let merchant = '';
      
      const refRegex = /(?:Nội dung|Thông tin|Details|Description|Nội dung giao dịch|Mô tả).*?:(.*?)(?:Số dư|Balance|Mã giao dịch|Cảm ơn|Trân trọng|$)/i;
      const refMatch = cleanBody.match(refRegex);
      if (refMatch && refMatch[1]) {
        reference = refMatch[1].trim();
      }
      
      if (reference) {
        if (reference.toLowerCase().includes('chuyen tien') || reference.toLowerCase().includes('chuyển tiền')) {
          type = 'transfer';
        }
        merchant = reference.substring(0, 50);
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
