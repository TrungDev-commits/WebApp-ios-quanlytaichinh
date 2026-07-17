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
      return {
        statusCode: 400, headers,
        body: JSON.stringify({
          error: 'Missing API Key',
          message: 'AI chưa được cấu hình. Vào https://aistudio.google.com/apikey lấy API key (miễn phí) và thêm vào biến môi trường GEMINI_API_KEY trong Netlify.'
        })
      };
    }

    if (!apiKey.startsWith('AIza')) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({
          error: 'Invalid API Key',
          message: 'API key không đúng định dạng. Key Google AI Studio bắt đầu bằng "AIza...". Vào https://aistudio.google.com/apikey để lấy key miễn phí.'
        })
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'netlify-build' } }
    });

    const { transactions, budgets, debts, savings, promptType, customMessage, cashflowData } = JSON.parse(event.body || '{}');

    const totalIncome = transactions?.filter((t: any) => t.type === 'income')?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
    const totalExpense = transactions?.filter((t: any) => t.type === 'expense')?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;

    const totalDebt = debts?.filter((d: any) => d.status === 'active')?.reduce((sum: number, d: any) => sum + (d.currentBalance || 0), 0) || 0;
    const totalMonthlyPayment = debts?.filter((d: any) => d.status === 'active')?.reduce((sum: number, d: any) => sum + (d.monthlyPayment || 0), 0) || 0;

    let userPrompt = '';
    if (promptType === 'debt') {
      userPrompt = `Bạn là chuyên gia tư vấn tài chính. Hãy phân tích các khoản nợ sau và đưa ra chiến lược trả nợ tối ưu:

Dữ liệu khoản nợ: ${JSON.stringify(debts || [])}
Thu nhập hàng tháng: ${totalIncome} VNĐ
Chi tiêu hàng tháng: ${totalExpense} VNĐ

Yêu cầu:
1. Tổng quan: tổng dư nợ ${formatVND(totalDebt)}, tổng trả góp/tháng ${formatVND(totalMonthlyPayment)}.
2. Sắp xếp thứ tự ưu tiên trả nợ (nợ lãi suất cao trước).
3. Với mỗi khoản nợ: còn bao nhiêu kỳ, dự kiến tất toán khi nào.
4. Tư vấn chiến lược: nên trả hết dứt điểm hay vay xoay vòng? Lý do?
5. Đề xuất phương án để vừa trả nợ vừa còn tiền chi tiêu.`;
    } else if (promptType === 'balance') {
      userPrompt = `Bạn là chuyên gia tư vấn tài chính. Phân tích và đưa ra giải pháp cân đối dòng tiền:

Thu nhập: ${totalIncome} VNĐ
Chi tiêu: ${totalExpense} VNĐ
Ngân sách: ${JSON.stringify(budgets || [])}
Khoản nợ: ${JSON.stringify(debts || [])}
Giao dịch gần đây: ${JSON.stringify(transactions?.slice(0, 10))}

Yêu cầu:
1. Đánh giá tỷ lệ chi tiêu/thu nhập.
2. Sau khi trả nợ còn bao nhiêu?
3. Gợi ý phân bổ dòng tiền theo quy tắc 50/30/20 hoặc 6 chiếc lọ.
4. 3 mẹo thiết thực để tăng tích lũy ngay tháng này.`;
    } else if (promptType === 'savings') {
      const available = totalIncome - totalExpense - totalMonthlyPayment;
      userPrompt = `Bạn là chuyên gia tài chính. Hãy phân tích mục tiêu tiết kiệm:

Mục tiêu: ${JSON.stringify(savings || [])}
Thu nhập: ${totalIncome} VNĐ
Chi tiêu: ${totalExpense} VNĐ
Trả nợ/tháng: ${totalMonthlyPayment} VNĐ
Còn lại: ${available} VNĐ

Yêu cầu:
1. Đánh giá khả thi của mục tiêu.
2. Lộ trình tích lũy hàng tháng.
3. Gợi ý kênh tiết kiệm phù hợp.`;
    } else {
      userPrompt = `Bạn là trợ lý tài chính cá nhân. Hãy trả lời câu hỏi của người dùng:

Câu hỏi: "${customMessage}"

Bối cảnh tài chính:
- Thu nhập: ${totalIncome} VNĐ
- Chi tiêu: ${totalExpense} VNĐ
- Nợ: ${JSON.stringify(debts || [])}
- Tiết kiệm: ${JSON.stringify(savings || [])}
- Dữ liệu dòng tiền: ${JSON.stringify(cashflowData || {})}

Trả lời bằng tiếng Việt, dùng số liệu cụ thể, dễ áp dụng. Nếu câu hỏi về chiến lược nợ, hãy tính toán và so sánh các phương án.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "Bạn là Gemini Co-Visor, cố vấn tài chính cá nhân cao cấp. Luôn trả lời bằng tiếng Việt, dùng Markdown, gạch đầu dòng, số liệu cụ thể. Tư vấn thực tế, dễ hiểu, có tính ứng dụng ngay.",
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
    const message = error.message?.includes('API_KEY')
      ? 'GEMINI_API_KEY không hợp lệ hoặc đã hết hạn. Vào https://aistudio.google.com/apikey lấy key mới (miễn phí).'
      : error.message;
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi kết nối AI', message }) };
  }
};

function formatVND(num: number) {
  if (num >= 1000000) return Math.round(num / 1000000) + 'tr';
  if (num >= 1000) return Math.round(num / 1000) + 'k';
  return num.toString();
}