export default function DashboardPage() {
  return (
    <div className="min-h-full bg-[#FFFBF5] text-[#0F172A]">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-5">
        <span className="text-xl font-bold tracking-tight">mgscholar.ai</span>
        <button
          type="button"
          className="rounded-full bg-[#0F172A] px-5 py-2 text-sm font-medium text-white"
        >
          الاشتراك
        </button>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-6 pb-10" dir="rtl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">مرحباً، أحمد</h1>
          <p className="mt-1 text-[#0F172A]/70">مادة اليوم: القانون التجاري</p>
        </div>

        {/* Chat Interface */}
        <div className="flex flex-col gap-4">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl border border-[#0F172A] bg-[#E0EFFF] px-4 py-3">
              <p>ما هو تعريف العقد التجاري؟</p>
            </div>
          </div>

          {/* AI Response */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-[#0F172A] bg-[#FFFBF5] px-4 py-3">
              <p className="mb-2">العقد التجاري هو اتفاق بين تاجرين أو بين تاجر وغير تاجر:</p>
              <ol className="list-decimal space-y-1 pr-5">
                <li>يُبرم بقصد ممارسة نشاط تجاري.</li>
                <li>يخضع لقواعد القانون التجاري الخاصة.</li>
                <li>يُفترض تجارته ما لم يُثبت العكس.</li>
              </ol>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#0F172A] bg-[#FFF3C4] px-4 py-3">
              <p className="text-sm">
                <span className="ml-1">💡</span>
                ملاحظة الأستاذ: هذا السؤال تكرر في امتحان 2024
              </p>
            </div>
            <div className="rounded-2xl border border-[#0F172A] bg-[#FFE4E8] px-4 py-3">
              <p className="text-sm">
                <span className="ml-1">📄</span>
                تحميل الصفحة 14 من مطبوع الأستاذ
              </p>
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="relative mt-8">
          <input
            type="text"
            placeholder="اكتب سؤالك هنا..."
            className="w-full rounded-full border border-[#0F172A] bg-[#FFFBF5] py-3 pl-14 pr-5 text-[#0F172A] placeholder:text-[#0F172A]/40 outline-none"
          />
          <button
            type="button"
            aria-label="إرسال"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#0F172A] text-white"
          >
            ↑
          </button>
        </div>
      </main>
    </div>
  );
}
