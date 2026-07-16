import { Handler } from '@netlify/functions';
import { GoogleGenAI, Type } from '@google/genai';

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

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'netlify-build' } }
    });

    const { transactions, budgets, debts, savings, promptType, customMessage } = JSON.parse(event.body || '{}');

    const financialSummary = {
      transactionsCount: transactions?.length || 0,
      totalIncome: transactions?.filter((t: any) => t.type === 'income')?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0,
      totalExpense: transactions?.filter((t: any) => t.type === 'expense')?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0,
      budgets: budgets || [],
      debts: debts || [],
      savings: savings || []
    };

    let userPrompt = '';
    if (promptType === 'debt') {
      userPrompt = `Bạn là một chuyên gia tư vấn tài chính cấp cao của iOS 26.4 Finance Advisor. Hãy phân tích các khoản nợ sau và thiết lập Chiến lược trả nợ tối ưu (Phương pháp Tuyết lăn - Debt Snowball hoặc Quả cầu tuyết):
Dữ liệu khoản nợ: ${JSON.stringify(financialSummary.debts)}
Dòng tiền thu nhập hàng tháng: ${financialSummary.totalIncome} VNĐ
Dòng tiền chi tiêu hàng tháng: ${financialSummary.totalExpense} VNĐ

Yêu cầu phân tích chi tiết:
1. Tổng quan tình trạng nợ nần hiện tại (Tổng vay nợ ròng, tỷ lệ nợ/thu nhập).
2. Thứ tự ưu tiên thanh toán các khoản nợ theo phương pháp Tuyết lăn (Snowball).
3. Các hành động cụ thể để cắt giảm chi tiêu, dồn tiền thanh toán nợ nhanh nhất.
4. Lời khuyên động viên tài chính chuyên nghiệp, ngắn gọn, súc tích.`;
    } else if (promptType === 'balance') {
      userPrompt = `Bạn là chuyên gia tư vấn tài chính cá nhân của iOS 26.4 Finance Advisor. Hãy phân tích thu nhập và chi tiêu của tôi để đưa ra giải pháp cân đối dòng tiền hiệu quả:
Thu nhập: ${financialSummary.totalIncome} VNĐ
Chi tiêu: ${financialSummary.totalExpense} VNĐ
Ngân sách (Budgets) thiết lập: ${JSON.stringify(financialSummary.budgets)}
Danh sách giao dịch gần đây: ${JSON.stringify(transactions?.slice(0, 10))}

Yêu cầu phân tích chi tiết:
1. Đánh giá tính cân đối của dòng tiền (Dư nợ ròng, tỷ lệ chi tiêu/thu nhập).
2. Phát hiện các danh mục chi tiêu đang lãng phí hoặc vượt quá hạn mức ngân sách đã đặt.
3. Gợi ý cụ thể quy tắc phân bổ dòng tiền (ví dụ 50/30/20 hoặc 6 chiếc lọ) phù hợp nhất với trạng thái hiện tại.
4. 3 mẹo thiết thực để tăng dòng tiền tích lũy ngay trong tháng này.`;
    } else if (promptType === 'savings') {
      userPrompt = `Bạn là chuyên gia tài chính cá nhân của iOS 26.4 Finance Advisor. Hãy phân tích và đưa ra Chiến lược tích lũy đột phá dựa trên các mục tiêu tiết kiệm sau:
Mục tiêu tích lũy: ${JSON.stringify(financialSummary.savings)}
Thu nhập khả dụng thực tế hiện tại (sau khi đối chiếu nợ nần & chi tiêu): ${(financialSummary.totalIncome + (financialSummary.debts?.filter((d: any) => d.type === 'receivable')?.reduce((sum: number, d: any) => sum + (d.amount - d.paid), 0) || 0)) - (financialSummary.totalExpense + (financialSummary.debts?.filter((d: any) => d.type === 'payable')?.reduce((sum: number, d: any) => sum + (d.amount - d.paid), 0) || 0))} VNĐ

Yêu cầu phân tích chi tiết:
1. Đánh giá tính khả thi của mục tiêu tiết kiệm hiện tại dựa trên lộ trình thời gian.
2. Thiết lập lộ trình phân bổ tài sản thông minh vào quỹ tiết kiệm định kỳ hàng tháng.
3. Đề xuất các kênh tích lũy tối ưu an toàn hiệu quả (Ví dụ gửi tiết kiệm tích lũy số, chứng chỉ quỹ).
4. Tạo động lực tiết kiệm bằng lời khuyên tư duy tài chính thông thái.`;
    } else {
      userPrompt = `Bạn là Trợ lý Cố vấn AI tài chính cá nhân Gemini Co-Visor (ngôn ngữ iOS 26.4). Hãy trả lời câu hỏi cụ thể của người dùng dưới góc nhìn tài chính chuyên nghiệp, thực tế và cực kỳ súc tích.
Câu hỏi của người dùng: "${customMessage}"
Bối cảnh tài chính hiện tại của người dùng:
- Tổng thu nhập: ${financialSummary.totalIncome} VNĐ
- Tổng chi tiêu: ${financialSummary.totalExpense} VNĐ
- Danh sách ngân sách: ${JSON.stringify(financialSummary.budgets)}
- Các khoản nợ: ${JSON.stringify(financialSummary.debts)}
- Mục tiêu tích lũy: ${JSON.stringify(financialSummary.savings)}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "Bạn là Gemini Co-Visor, một cố vấn tài chính cá nhân cao cấp. Bạn nói tiếng Việt, trả lời cực kỳ lịch thiệp, chuyên nghiệp, súc tích, trực quan, sử dụng các gạch đầu dòng rõ ràng, định dạng Markdown đẹp mắt, không dông dài.",
        temperature: 0.7,
      }
    });

    return { statusCode: 200, headers, body: JSON.stringify({ text: response.text }) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi kết nối AI', message: error.message }) };
  }
};
