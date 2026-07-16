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

    const { image, sampleName } = JSON.parse(event.body || '{}');
    let contentsPayload: any;

    if (image && typeof image === 'string' && image.startsWith('data:image')) {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Định dạng ảnh không hợp lệ' }) };
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      contentsPayload = {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: 'Phân tích hóa đơn này và trích xuất thông tin giao dịch chính xác. Trả về định dạng JSON duy nhất: { "amount": số nguyên (số tiền hóa đơn), "category": chọn từ [\'Ăn uống\', \'Di chuyển\', \'Mua sắm\', \'Hóa đơn\', \'Khác\'], "description": chuỗi mô tả ngắn }. Chỉ trả về JSON thô.' }
        ]
      };
    } else {
      let promptText = '';
      if (sampleName === 'starbucks') {
        promptText = 'Hãy giả định bạn vừa quét một hóa đơn Starbucks Coffee trị giá 85000 VNĐ. Trả về JSON: { "amount": 85000, "category": "Ăn uống", "description": "Cà phê Starbucks" }';
      } else if (sampleName === 'coopmart') {
        promptText = 'Hãy giả định bạn vừa quét một hóa đơn siêu thị Co.opmart trị giá 450000 VNĐ. Trả về JSON: { "amount": 450000, "category": "Mua sắm", "description": "Thực phẩm Co.opmart" }';
      } else if (sampleName === 'cgv') {
        promptText = 'Hãy giả định bạn vừa quét một hóa đơn rạp phim CGV Cinemas trị giá 220000 VNĐ. Trả về JSON: { "amount": 220000, "category": "Mua sắm", "description": "Vé xem phim CGV" }';
      } else {
        promptText = 'Hãy giả định một hóa đơn mua sắm ngẫu nhiên trị giá 150000 VNĐ. Trả về JSON: { "amount": 150000, "category": "Mua sắm", "description": "Hóa đơn mua sắm" }';
      }
      contentsPayload = promptText;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contentsPayload,
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

    const resultText = response.text?.trim() || '';
    const parsedData = JSON.parse(resultText);
    return { statusCode: 200, headers, body: JSON.stringify(parsedData) };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Lỗi quét hóa đơn', message: error.message }) };
  }
};
