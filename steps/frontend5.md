features/pipeline/ modülünü oluştur:

PAGES:
1. PipelinePage: Kanban board görünümü

COMPONENTS:
1. PipelineBoard: Ana Kanban container
2. PipelineColumn: Her stage için bir sütun (7 adet)
   - Başlık: Stage adı + müşteri sayısı
   - Droppable area
3. PipelineCard: Müşteri kartı (draggable)
   - Müşteri adı, lead score, assign edilen kişi
   - Son aktivite zamanı
4. StageProgressBar: Funnel görselleştirme
5. LostReasonDialog: Müşteri kaybedildiğinde neden seçimi

HOOKS:
1. usePipeline: Board verisi
2. useDragDrop: Drag & drop logic

DRAG & DROP:
react-beautiful-dnd kullan
onDragEnd: API'ye stage değişikliği gönder

API CALLS:
GET  /api/v1/pipeline/overview (Stage bazında müşteriler)
POST /api/v1/pipeline/move (Stage değiştir)

STAGES:
1. LEAD (Yeni)
2. CONTACT (İletişimde)
3. PROPOSAL (Teklif Verildi)
4. SCHEDULED (Randevu Kesinleşti)
5. SURGERY_COMPLETED (Ameliyat Tamamlandı)
6. POST_FOLLOW_UP (Takip)
7. LOST (Kayıp)

Her stage değişikliğinde:
- Optimistic update (hızlı UI)
- API'ye istek gönder
- Hata durumunda geri al

LostReasonDialog: Müşteri LOST stage'ine taşınırken açılsın
Nedenler: Fiyat, Güven, Doktor, Tarih, Diğer

Önce PipelineBoard ve PipelineColumn oluştur.