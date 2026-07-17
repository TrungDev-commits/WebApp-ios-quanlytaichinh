import { Handler } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing API Key', message: 'Vui lòng cấu hình GEMINI_API_KEY trong Netlify Environment Variables.' }) };
    }

    if (!apiKey.startsWith('AIza')) {
      console.warn('GEMINI_API_KEY format looks invalid (should start with AIza...)');
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'netlify-build' } }
    });

    const { transactions, budgets, debts, savings, promptType, customMessage } = JSON.parse(event.body || '{}');

    const totalIncome = transactions?.filter((t: any) => t.type === 'income')?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const totalExpense = transactions?.filter((t: any) => t.type === 'expense')?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const totalReceivable = debts?.filter((d: any) => d.type === 'receivable')?.reduce((sum: number, d: any) => sum + (d.amount - d.paid), 0) || 0;
    const totalPayable = debts?.filter((d: any) => d.type === 'payable')?.reduce((sum: number, d: any) => sum + (d.amount - d.paid), 0) || 0;

    let userPrompt = '';
    if (promptType === 'debt') {
      userPrompt = `Bạn là một chuyên gia tư vấn tài chính cấp cao. Hãy phân tích các khoản nợ sau và thiết lập Chiến lược trả nợ tối ưu (Phương pháp Tuyết lăn - Debt Snowball):
Dữ liệu khoản nợ: ${JSON.stringify(debts || [])}
Thu nhập hàng tháng: ${totalIncome} VNĐ
Chi tiêu hàng tháng: ${totalExpense} VNĐ

Yêu cầu:
1. Tổng quan tình trạng nợ (Tổng vay nợ ròng, tỷ lệ nợ/thu nhập).
2. Thứ tự ưu tiên thanh toán theo phương pháp Snowball.
3. Hành động cụ thể để cắt giảm chi tiêu, dồn tiền trả nợ.
4. Lời khuyên động viên, ngắn gọn súc tích.`;
    } else if (promptType === 'balance') {
      userPrompt = `Bạn là chuyên gia tư vấn tài chính cá nhân. Hãy phân tích thu nhập và chi tiêu để đưa ra giải pháp cân đối dòng tiền:
Thu nhập: ${totalIncome} VNĐ
Chi tiêu: ${totalExpense} VNĐ
Ngân sách: ${JSON.stringify(budgets || [])}
Giao dịch gần đây: ${JSON.stringify(transactions?.slice(0, 10))}

Yêu cầu:
1. Đánh giá cân đối dòng tiền (tỷ lệ chi tiêu/thu nhập).
2. Phát hiện danh mục chi tiêu lãng phí hoặc vượt hạn mức.
3. Gợi ý quy tắc phân bổ dòng tiền (50/30/20 hoặc 6 chiếc lọ).
4. 3 mẹo thiết thực để tăng tích lũy ngay trong tháng này.`;
    } else if (promptType === 'savings') {
      const available = (totalIncome + totalReceivable) - (totalExpense + totalPayable);
      userPrompt = `Bạn là chuyên gia tài chính cá nhân. Hãy phân tích và đưa ra Chiến lược tích lũy dựa trên mục tiêu tiết kiệm sau:
Mục tiêu: ${JSON.stringify(savings || [])}
Thu nhập khả dụng: ${available} VNĐ

Yêu cầu:
1. Đánh giá tính khả thi của mục tiêu tiết kiệm.
2. Lộ trình phân bổ tài sản vào quỹ tiết kiệm hàng tháng.
3. Đề xuất kênh tích lũy an toàn hiệu quả.
4. Lời khuyên tạo động lực tiết kiệm.`;
    } else {
      userPrompt = `Bạn là Trợ lý Cố vấn AI tài chính cá nhân Gemini Co-Visor. Hãy trả lời câu hỏi của người dùng dưới góc nhìn tài chính chuyên nghiệp, thực tế và súc tích.
Câu hỏi: "${customMessage}"
Bối cảnh:
- Thu nhập: ${totalIncome} VNĐ
- Chi tiêu: ${totalExpense} VNĐ
- Ngân sách: ${JSON.stringify(budgets || [])}
- Nợ: ${JSON.stringify(debts || [])}
- Mục tiêu tích lũy: ${JSON.stringify(savings || [])}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "Bạn là Gemini Co-Visor, cố vấn tài chính cá nhân cao cấp. Nói tiếng Việt, trả lời lịch thiệp, chuyên nghiệp, súc tích, dùng gạch đầu dòng, Markdown đẹp.",
        temperature: 0.7,
      }
    });

    const text = response?.text;
    if (!text) {
      throw new Error('AI không trả về phản hồi');
    }

    return { statusCode: 200, headers, body: JSON.stringify({ text }) };
  } catch (error: any) {
    console.error('gemini-advisor error:', error);
    const message = error.message?.includes('API_KEY') ? 'GEMINI_API_KEY không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình.' : error.message;
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi kết nối AI', message }) };
  }
};
