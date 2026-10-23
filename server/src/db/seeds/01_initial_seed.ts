import type { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function seed(knex: Knex): Promise<void> {
  await knex("usage_logs").del();
  await knex("payment_transactions").del();
  await knex("auth_tokens").del();
  await knex("oauth_accounts").del();
  await knex("services").del();
  await knex("categories").del();
  await knex("users").del();

  const insertedCategories = await knex("categories")
    .insert([
      { slug: "pdf", name: "Công cụ PDF", icon: "file-text", sort_order: 1 },
      { slug: "image", name: "Xử lý Ảnh", icon: "image", sort_order: 2 },
      { slug: "video", name: "Công cụ Video", icon: "video", sort_order: 3 },
      { slug: "ai-writer", name: "AI Viết văn bản", icon: "sparkles", sort_order: 4 },
      { slug: "file-tools", name: "Tiện ích Tệp", icon: "folder-cog", sort_order: 5 },
    ])
    .returning(["id", "slug"]);

  const catMap = Object.fromEntries(insertedCategories.map((c) => [c.slug, c.id]));

  await knex("services").insert([
    { category_id: catMap["pdf"], slug: "merge-pdf", name: "Ghép nối file PDF", short_desc: "Gộp nhiều tài liệu PDF thành một tệp duy nhất theo thứ tự tùy chỉnh.", status: "ready", is_visible: true, credit_cost: 0, usage_count: 340 },
    { category_id: catMap["pdf"], slug: "compress-pdf", name: "Nén giảm dung lượng PDF", short_desc: "Giảm kích thước file PDF tối đa mà vẫn giữ nguyên độ sắc nét của văn bản.", status: "ready", is_visible: true, credit_cost: 1, usage_count: 215 },
    { category_id: catMap["pdf"], slug: "pdf-to-word", name: "Chuyển đổi PDF sang Word", short_desc: "Trích xuất nội dung PDF sang định dạng DOCX giữ nguyên bố cục bảng biểu.", status: "soon", is_visible: true, credit_cost: 2, usage_count: 45 },

    { category_id: catMap["image"], slug: "image-compressor", name: "Nén và tối ưu hóa ảnh", short_desc: "Giảm tới 80% dung lượng ảnh PNG, JPG, WebP phục vụ tăng tốc website.", status: "ready", is_visible: true, credit_cost: 0, usage_count: 520 },
    { category_id: catMap["image"], slug: "image-converter", name: "Chuyển đổi định dạng ảnh", short_desc: "Đổi đuôi ảnh nhanh chóng giữa các chuẩn PNG, JPEG, WEBP và AVIF.", status: "ready", is_visible: true, credit_cost: 0, usage_count: 310 },
    { category_id: catMap["image"], slug: "remove-bg", name: "Xóa phông nền ảnh bằng AI", short_desc: "Tách nền chủ thể tự động chỉ trong 3 giây với độ chính xác từng sợi tóc.", status: "soon", is_visible: true, credit_cost: 3, usage_count: 89 },

    { category_id: catMap["video"], slug: "video-to-gif", name: "Chuyển Video ngắn sang GIF", short_desc: "Tạo ảnh động GIF mượt mà từ đoạn cắt MP4 hoặc WebM yêu thích của bạn.", status: "ready", is_visible: true, credit_cost: 1, usage_count: 140 },
    { category_id: catMap["video"], slug: "extract-audio", name: "Tách nhạc MP3 từ Video", short_desc: "Trích xuất âm thanh chất lượng cao 320kbps từ tệp video bất kỳ.", status: "ready", is_visible: true, credit_cost: 1, usage_count: 195 },
    { category_id: catMap["video"], slug: "video-compressor", name: "Nén dung lượng Video MP4", short_desc: "Thu nhỏ kích thước video để dễ dàng đính kèm qua email hoặc Discord.", status: "soon", is_visible: false, credit_cost: 2, usage_count: 12 }, // 1 dịch vụ đang ẩn để test Admin

    { category_id: catMap["ai-writer"], slug: "word-counter", name: "Đếm từ và phân tích văn bản", short_desc: "Thống kê số từ, ký tự, câu, đoạn văn và ước tính thời gian đọc chuẩn xác.", status: "ready", is_visible: true, credit_cost: 0, usage_count: 680 },
    { category_id: catMap["ai-writer"], slug: "ai-summarizer", name: "Tóm tắt văn bản thông minh", short_desc: "Rút gọn bài báo dài thành các gạch đầu dòng nắm bắt ý chính trong nháy mắt.", status: "ready", is_visible: true, credit_cost: 2, usage_count: 410 },
    { category_id: catMap["ai-writer"], slug: "grammar-checker", name: "Kiểm tra chính tả & ngữ pháp", short_desc: "Phát hiện lỗi gõ phím và gợi ý diễn đạt chuyên nghiệp hơn cho tiếng Việt và Anh.", status: "soon", is_visible: true, credit_cost: 1, usage_count: 75 },

    { category_id: catMap["file-tools"], slug: "json-formatter", name: "Định dạng và kiểm tra JSON", short_desc: "Làm đẹp (Prettify), thu gọn (Minify) và bắt lỗi cú pháp chuỗi JSON tức thì.", status: "ready", is_visible: true, credit_cost: 0, usage_count: 490 },
    { category_id: catMap["file-tools"], slug: "csv-to-json", name: "Chuyển đổi bảng CSV sang JSON", short_desc: "Biến dữ liệu bảng tính CSV thành mảng đối tượng JSON chuẩn cho lập trình viên.", status: "ready", is_visible: true, credit_cost: 0, usage_count: 275 },
    { category_id: catMap["file-tools"], slug: "hash-generator", name: "Tạo mã băm MD5 / SHA-256", short_desc: "Kiểm tra tính toàn vẹn của tệp hoặc chuỗi văn bản bằng thuật toán băm chuẩn.", status: "ready", is_visible: true, credit_cost: 0, usage_count: 160 },
  ]);

  //  Tạo tài khoản Admin và User mẫu (Mật khẩu chung: 12345678)
  const passwordHash = await bcrypt.hash("12345678", 10);

  await knex("users").insert([
    {
      email: "admin@toolnest.vn",
      password_hash: passwordHash,
      full_name: "Quản Trị Viên Hệ Thống",
      birth_year: 2004,
      phone: "0901234567",
      address: "Quận 9, TP. Hồ Chí Minh",
      role: "admin",
      status: "active",
      is_email_verified: true,
      credits: 999,
      plan_type: "premium",
    },
    {
      email: "user@toolnest.vn",
      password_hash: passwordHash,
      full_name: "Nguyễn Văn An",
      birth_year: 2004,
      phone: "0987654321",
      address: "Hà Đông, Hà Nội",
      role: "user",
      status: "active",
      is_email_verified: true,
      credits: 20,
      plan_type: "free",
    },
  ]);
}