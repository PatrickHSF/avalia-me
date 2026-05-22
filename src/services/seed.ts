import { collection, query, where, getDocs, limit, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function seedProviders() {
  const providersHeader = await getDocs(query(collection(db, 'providers'), limit(1)));
  if (!providersHeader.empty) return; // Already seeded

  const providers = [
    {
      name: "João Silva",
      category: "Pedreiro",
      location: "Umuarama, PR",
      photoURL: "https://randomuser.me/api/portraits/men/32.jpg",
      description: "Especialista em reformas e construção civil. 15 anos de experiência.",
      whatsapp: "5544999999999",
      rating: 4.9,
      reviewCount: 128,
      featured: true
    },
    {
      name: "Maria Oliveira",
      category: "Eletricista",
      location: "Umuarama, PR",
      photoURL: "https://randomuser.me/api/portraits/women/44.jpg",
      description: "Instalações elétricas residenciais e comerciais. Rápido e seguro.",
      whatsapp: "5544888888888",
      rating: 4.8,
      reviewCount: 89,
      featured: true
    },
    {
      name: "Carlos Mendes",
      category: "Encanador",
      location: "Londrina, PR",
      photoURL: "https://randomuser.me/api/portraits/men/55.jpg",
      description: "Reparos hidráulicos, vazamentos e desentupimentos.",
      whatsapp: "5543777777777",
      rating: 5.0,
      reviewCount: 201,
      featured: true
    },
    {
      name: "Ana Souza",
      category: "Pintora",
      location: "Maringá, PR",
      photoURL: "https://randomuser.me/api/portraits/women/22.jpg",
      description: "Pintura residencial e decorativa. Acabamento fino.",
      whatsapp: "5544666666666",
      rating: 4.7,
      reviewCount: 45,
      featured: false
    },
    {
      name: "Pedro Santos",
      category: "Marceneiro",
      location: "Cascavel, PR",
      photoURL: "https://randomuser.me/api/portraits/men/11.jpg",
      description: "Móveis planejados e reformas de madeira.",
      whatsapp: "5545555555555",
      rating: 4.9,
      reviewCount: 67,
      featured: false
    }
  ];

  for (const p of providers) {
    await addDoc(collection(db, 'providers'), p);
  }
}
