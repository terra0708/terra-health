features/communication/ modülünü oluştur:

PAGES:
1. InboxPage: Unified inbox (WhatsApp/Instagram/Facebook)

COMPONENTS:
1. ChatWidget: Sağ tarafta mesajlaşma penceresi
2. ConversationList: Sol tarafta konuşma listesi
   - Son mesaj, zaman, okunmamış sayısı
3. MessageThread: Mesaj akışı
   - Müşteri mesajları sağda, agent solda
4. MessageInput: Mesaj gönderme
   - Text input, emoji picker, dosya ekleme
5. ChannelBadge: WhatsApp/Instagram/Facebook ikonu
6. TemplateSelector: Hazır mesaj şablonları
   - Dropdown ile seç, otomatik doldur
7. TranslateButton: Mesajı çevir (TR/EN)

HOOKS:
1. useConversations: Konuşma listesi
2. useMessages: Mesaj akışı
3. useWebSocket: Real-time mesajlaşma
4. useMessageTemplates: Şablonları getir

SERVICES:
- getConversations()
- getMessages(conversationId)
- sendMessage(conversationId, content)
- getTemplates()
- translateMessage(text, targetLang)

WEBSOCKET (Socket.io):
- Connect: /ws/chat/:conversationId
- Events:
  - message.received: Yeni mesaj geldi
  - message.sent: Mesaj gönderildi
  - typing: Karşı taraf yazıyor

FEATURES:
- Auto-scroll to latest message
- Unread badge
- Typing indicator
- Message timestamps
- Media support (görsel gönderme)

TEMPLATES:
Kategori bazlı:
- Hoşgeldin mesajı
- Randevu onayı
- Fiyat bilgisi
- Takip mesajı

Her template TR/EN versiyonları

TRANSLATION:
TranslateButton tıklanınca:
- API'ye çeviri isteği at
- Çevrilmiş metni message'ın altında göster

Önce ConversationList ve MessageThread oluştur.