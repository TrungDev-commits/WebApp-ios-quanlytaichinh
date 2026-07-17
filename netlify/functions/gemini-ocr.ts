import { Handler } from '@netlify/functions';
import { GoogleGenAI, Type } from '@google/genai';

const SAMPLE_RESPONSES: Record<string, { amount: number; category: string; description: string }> = {
  starbucks: { amount: 85000, category: 'Ăn uống', description: 'Cà phê Starbucks' },
  coopmart: { amount: 450000, category: 'Mua sắm', description: 'Thực phẩm Co.opmart' },
  cgv: { amount: 220000, category: 'Mua sắm', description: 'Vé xem phim CGV' },
};

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
    const { image, sampleName } = JSON.parse(event.body || '{}');

    if (sampleName && SAMPLE_RESPONSES[sampleName]) {
      return { statusCode: 200, headers, body: JSON.stringify(SAMPLE_RESPONSES[sampleName]) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing API Key', message: 'Vui lòng cấu hình GEMINI_API_KEY trong Netlify Environment Variables.' }) };
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'netlify-build' } }
    });

    if (!image || typeof image !== 'string' || !image.startsWith('data:image')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Không tìm thấy ảnh hợp lệ' }) };
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Định dạng ảnh không hợp lệ' }) };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { inlineData: { mimeType: matches[1], data: matches[2] } },
        { text: 'Phân tích hóa đơn này, trích xuất: tổng tiền (amount), danh mục (category: Ăn uống/Di chuyển/Mua sắm/Hóa đơn/Khác), mô tả ngắn (description). Chỉ trả về JSON.' }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.INTEGER, description: 'Total bill amount in VND' },
            category: { type: Type.STRING, description: 'Must be one of: Ăn uống, Di chuyển, Mua sắm, Hóa đơn, Khác' },
            description: { type: Type.STRING, description: 'Short summary of the receipt' }
          },
          required: ['amount', 'category', 'description']
        }
      }
    });

    const resultText = response.text?.trim();
    if (!resultText) throw new Error('AI không trả về kết quả');

    const parsedData = JSON.parse(resultText);
    return { statusCode: 200, headers, body: JSON.stringify(parsedData) };
  } catch (error: any) {
    console.error('gemini-ocr error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi quét hóa đơn', message: error.message }) };
  }
};
