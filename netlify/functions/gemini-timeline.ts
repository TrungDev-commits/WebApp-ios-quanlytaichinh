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
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing API Key' })
      };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'netlify-build' } }
    });

    const { partner, amtPerPeriod, installments, startDate, dueDate, paymentDueDay } = JSON.parse(event.body || '{}');

    if (!amtPerPeriod || !installments || !startDate || !dueDate) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Thiếu dữ liệu đầu vào' })
      };
    }

    const prompt = `Bạn là một hệ thống tính toán lịch thanh toán nợ. Hãy tạo lộ trình thanh toán chính xác theo yêu cầu.

Thông tin khoản nợ:
- Đối tác: ${partner}
- Số tiền mỗi kỳ: ${amtPerPeriod} VNĐ
- Tổng số kỳ: ${installments}
- Ngày bắt đầu tính nợ: ${startDate}
- Ngày đáo hạn cuối cùng: ${dueDate}
- Mỗi kỳ phải thanh toán trước ngày: ${paymentDueDay} hàng tháng

Yêu cầu:
1. Tạo đúng ${installments} kỳ thanh toán.
2. Mỗi kỳ có ngày thanh toán là ngày ${paymentDueDay} của tháng tương ứng (ví dụ: ngày ${paymentDueDay} tháng đầu, ngày ${paymentDueDay} tháng tiếp theo, ...).
3. Kỳ đầu tiên bắt đầu từ tháng của ngày ${startDate}.
4. Kỳ cuối cùng không được vượt quá ngày ${dueDate}.
5. Mỗi kỳ amount luôn bằng ${amtPerPeriod}.

CHỈ trả về một mảng JSON hợp lệ, KHÔNG có text thêm, KHÔNG có markdown, KHÔNG có giải thích. Đúng định dạng:
[{"date":"YYYY-MM-DD","amount":${amtPerPeriod},"completed":false}]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Bạn là một công cụ tính toán lịch trả nợ. Chỉ được trả về mảng JSON thuần, không có bất kỳ text hay định dạng nào khác.',
        temperature: 0.1,
      }
    });

    let raw = (response.text || '').trim();

    // Strip markdown fences nếu AI vẫn trả về
    raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

    // Validate JSON
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('AI trả về dữ liệu không hợp lệ');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ timeline: parsed })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Lỗi xử lý AI', message: error.message })
    };
  }
};
