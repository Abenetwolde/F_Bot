const Payment = require("../Model/payment");

exports.createPayment=async(paymentData) =>{
console.log("paymentData.invoice_id..........",paymentData.invoice_id)
    try {
        const payment = new Payment({
            user: paymentData.user,
            order: paymentData.order,
            total_amount: paymentData.total_amount,
            invoice_id: paymentData.invoice_id,
            telegram_payment_charge_id: paymentData.telegram_payment_charge_id,
        });

        const savedPayment = await payment.save();
        return savedPayment;
    } catch (error) {
        console.error('Error creating payment:', error);
        throw new Error('Failed to create payment.');
    }
}
