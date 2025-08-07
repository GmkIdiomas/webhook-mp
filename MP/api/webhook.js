import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// Inicializa Firebase Admin (só uma vez)
if (!getApps().length) {
  initializeApp({
    credential: credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;
    
    // Log para debug
    console.log('Webhook recebido:', { action, data });
    
    if (action === 'payment.updated' && data?.id) {
      // Busca detalhes do pagamento
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      });
      
      const payment = await response.json();
      console.log('Payment details:', payment);
      
      if (payment.status === 'approved') {
        // Extrai energia da descrição "250 Energy GMK Idiomas"
        const description = payment.description || '';
        const energyMatch = description.match(/(\d+)\s*Energy/i);
        
        if (energyMatch) {
          const energy = parseInt(energyMatch[1]);
          console.log(`Energia a adicionar: ${energy}`);
          
          // Por enquanto, só loga (você vai implementar a lógica de usuário depois)
          console.log(`✅ Pagamento aprovado! ${energy} energia para adicionar`);
        }
      }
    }
    
    // Sempre responde OK para o MP
    res.status(200).json({ received: true, timestamp: new Date().toISOString() });
    
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: error.message });
  }
}