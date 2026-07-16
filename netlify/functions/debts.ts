import { Handler } from '@netlify/functions';
import { connectDB, Debt, Transaction, Budget } from './_db';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    await connectDB();

    if (event.httpMethod === 'GET') {
      const debts = await Debt.find().lean();
      return { statusCode: 200, headers, body: JSON.stringify(debts) };
    }

    if (event.httpMethod === 'POST' && event.body) {
      const body = JSON.parse(event.body);
      const newDebt = await Debt.create(body);
      return { statusCode: 201, headers, body: JSON.stringify(newDebt) };
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id;
      if (!id) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
      }
      await Debt.findOneAndDelete({ id } as any);
      return { statusCode: 200, headers, body: JSON.stringify({ deleted: true }) };
    }

    if (event.httpMethod === 'PUT' && event.body) {
      const { debtId, installmentIndex } = JSON.parse(event.body);
      const debt = await Debt.findOne({ id: debtId } as any);
      if (!debt) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Debt not found' }) };
      }

      const target = debt.timeline[installmentIndex];
      if (!target || target.completed) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Installment already completed or invalid' }) };
      }

      target.completed = true;
      debt.paid += target.amount;

      const isPayable = debt.type === 'payable';
      await Transaction.create({
        type: isPayable ? 'expense' : 'income',
        amount: target.amount,
        category: 'Hóa đơn',
        date: new Date().toISOString().split('T')[0],
        description: `Trả đợt ${installmentIndex + 1} nợ ${debt.partner}`,
        wallet: 'Ngân hàng'
      });

      if (isPayable) {
        const budget = await Budget.findOne({ category: 'Hóa đơn' } as any);
        if (budget) {
          budget.spent += target.amount;
          await budget.save();
        }
      }

      await debt.save();
      return { statusCode: 200, headers, body: JSON.stringify(debt) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
