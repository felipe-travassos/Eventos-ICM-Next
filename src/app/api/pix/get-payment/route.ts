import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const paymentId = searchParams.get('paymentId');

        if (!paymentId) {
            return NextResponse.json(
                { error: 'paymentId é obrigatório' },
                { status: 400 }
            );
        }

        // Configurar cliente do Mercado Pago
        const client = new MercadoPagoConfig({
            accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
        });

        const payment = new Payment(client);
        const result = await payment.get({ id: paymentId });

        // Extrair dados do PIX
        const pixData = {
            id: result.id,
            status: result.status,
            qr_code: result.point_of_interaction?.transaction_data?.qr_code,
            qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
            ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
            external_reference: result.external_reference,
            transaction_amount: result.transaction_amount,
            description: result.description,
            date_created: result.date_created,
            date_last_updated: result.date_last_updated
        };

        return NextResponse.json(pixData);

-    } catch (err: any) {
-        console.error('Erro ao buscar pagamento:', err);
-        return NextResponse.json(
-            { error: 'Erro ao buscar pagamento' },
-            { status: 500 }
-        );
+    } catch (err: unknown) {
+        const message = err instanceof Error ? err.message : 'Erro ao buscar pagamento';
+        console.error('Erro ao buscar pagamento:', err);
+        return NextResponse.json(
+            { error: message },
+            { status: 500 }
+        );
     }
}