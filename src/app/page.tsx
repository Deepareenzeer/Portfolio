// src/app/page.tsx
import Image from 'next/image'; // Import Component สำหรับแสดงรูปภาพจาก Next.js
import Link from 'next/link';  
 // Import Component สำหรับสร้างลิงก์จาก Next.js (ถ้าจะทำหน้ารายละเอียดโปรเจกต์)
const strapiApiUrl = process.env.STRAPI_API_URL || "http://localhost:1337";
// --- ส่วนที่ 1: กำหนด TypeScript Interfaces เพื่อความแข็งแกร่งของข้อมูล ---
// (เป็นสิ่งที่ดีมากสำหรับโปรเจกต์ขนาดใหญ่ ช่วยป้องกันข้อผิดพลาด)


type RichTextChild = {
  text: string;
  // อาจจะมีฟิลด์อื่น ๆ ที่ไม่รู้จัก
  [key: string]: unknown;
};

type RichTextBlock = {
  type: string;
  children: RichTextChild[];
};

function getPlainText(richText: RichTextBlock[]): string {
  return richText
    .map(block => {
      if (block.type === 'paragraph') {
        return block.children.map(child => child.text).join('');
      }
      return '';
    })
    .join('\n');
}
// Interface สำหรับข้อมูลรูปภาพ (ตามโครงสร้างที่ Strapi ส่งมา)
interface StrapiImage {
  data: {
    attributes: {
      url: string;
      alternativeText: string | null;
    };
  };
}

// Interface สำหรับ Attributes ของ Project (ข้อมูลหลักของแต่ละโปรเจกต์)
interface ProjectAttributes {
  title: string;
  description?: RichTextBlock[];
  thumbnail: StrapiImage; // ใช้ Interface รูปภาพที่เราสร้างไว้
  projectLink: string;
  tags: string; // ตรงนี้คือ string ที่มี comma คั่น เช่น "Web Dev, UI/UX"
  dateCompleted: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Interface สำหรับแต่ละ Project item ที่ Strapi ส่งมา
interface ProjectItem {
  id: number;
  attributes: ProjectAttributes;
}

// --- ส่วนที่ 2: ฟังก์ชันสำหรับดึงข้อมูลจาก Strapi API ---
// ฟังก์ชันนี้จะรันบน Server-side ของ Next.js (หรือตอน Build Time)
async function getPortfolios(): Promise<ProjectItem[]> {
  // **สำคัญมาก:** ใน Production, 'http://localhost:1337' จะต้องเปลี่ยนเป็น URL จริงของ Strapi ของคุณ
  // เราจะจัดการเรื่องนี้ในขั้นตอน Environment Variables
  const strapiApiUrl = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';

  // 'populate=*' คือการบอก Strapi ให้ส่งข้อมูลของ Fields ที่เป็น Relation (เช่น รูปภาพ thumbnail) มาด้วย
  const res = await fetch(`${strapiApiUrl}/api/Portfolios?populate=*`, {
    // revalidate every 60 seconds
    // Next.js จะพยายามดึงข้อมูลใหม่ทุกๆ 60 วินาทีใน Production (ISR)
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    // หากเกิดข้อผิดพลาดในการดึงข้อมูล (เช่น Server ล่ม, URL ผิด)
    // จะโยน Error ออกไป เพื่อให้ Next.js จัดการแสดงหน้า Error
    throw new Error(`Failed to fetch projects: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  // Strapi จะส่งข้อมูลมาในรูปแบบ { data: [...], meta: {...} }
  // เราต้องการแค่ส่วน `data` ที่เป็น Array ของ Project
  return data.data;
}

// --- ส่วนที่ 3: Component หลักของหน้า Portfolio ---
// นี่คือ Server Component ใน Next.js (async function)
export default async function HomePage() {
  let projects: ProjectItem[] = [];
  let error: string | null = null;

  try {
    projects = await getPortfolios(); // เรียกฟังก์ชันดึงข้อมูล
  } catch (e: unknown) {
    error = (e instanceof Error) ? e.message : "An unknown error occurred.";
    console.error("Failed to load projects:", e); // พิมพ์ Error ใน Server Console
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header / Intro Section */}
        <section className="text-center py-16 px-4">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 animate-fade-in-down">
            สวัสดีครับ ผมคือ [ชื่อของคุณ]
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-8 animate-fade-in-up">
            ยินดีต้อนรับสู่ Portfolio ของผม ที่นี่คุณจะได้เห็นผลงานล่าสุดและสิ่งที่ผมหลงใหลในการสร้างสรรค์.
          </p>
          <Link
            href="#projects-section" // Link ไปยังส่วน Projects ด้านล่าง
            className="inline-block bg-indigo-600 text-white text-lg font-medium px-8 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-105 animate-bounce-in"
          >
            ดูผลงานของฉัน
          </Link>
        </section>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
            <p className="text-sm mt-1">โปรดตรวจสอบว่า Strapi Server ของคุณรันอยู่และอนุญาตการเข้าถึง API แล้ว</p>
          </div>
        )}

        {/* Projects Section */}
        <section id="projects-section" className="py-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12 animate-fade-in-down">
            ผลงานล่าสุดของฉัน
          </h2>

          {projects.length === 0 && !error && (
            <p className="text-gray-600 text-center text-lg col-span-full">
              ยังไม่มีผลงาน เพิ่มผลงานใน Strapi ของคุณเลย!
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transform transition duration-300 hover:scale-105 hover:shadow-xl group"
              >
                {project.attributes.thumbnail?.data?.attributes?.url && (
                  <div className="relative w-full h-56 overflow-hidden">
                    <Image
                      src={`${strapiApiUrl}${project.attributes.thumbnail.data.attributes.url}`} // URL รูปภาพ
                      alt={project.attributes.thumbnail.data.attributes.alternativeText || project.attributes.title}
                      fill // ทำให้รูปภาพเต็มพื้นที่
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // เพิ่ม sizes prop สำหรับ Next/Image
                      style={{ objectFit: 'cover' }} // เพิ่ม style ให้รูปภาพพอดีพื้นที่
                  />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2 truncate">
                    {project.attributes.title}
                  </h3>
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {project.attributes.description
                      ? getPlainText(project.attributes.description)
                      : 'ไม่มีคำอธิบายสำหรับโปรเจกต์นี้'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.attributes.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                  {project.attributes.projectLink && (
                    <a
                      href={project.attributes.projectLink}
                      target="_blank" // เปิดใน Tab ใหม่
                      rel="noopener noreferrer" // เพิ่มความปลอดภัย
                      className="inline-flex items-center bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:translate-y-px"
                    >
                      เยี่ยมชมโปรเจกต์
                      <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* About Me / Contact Section (Placeholder) */}
        <section className="text-center py-16 px-4 bg-white rounded-xl shadow-lg mt-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">เกี่ยวกับฉัน & ติดต่อ</h2>
          <p className="text-lg text-gray-700 max-w-xl mx-auto mb-8">
            ผมคือ [ชื่อของคุณ] ผู้หลงใหลในการสร้างสรรค์ [สิ่งที่คุณทำ/สนใจ]
            หากคุณมีโปรเจกต์ที่น่าสนใจ หรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อผมได้ที่:
          </p>
          <div className="flex justify-center items-center space-x-6">
            <a
              href="mailto:your.email@example.com"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-xl font-medium"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-1 13a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v14z"></path></svg>
              your.email@example.com
            </a>
            {/* เพิ่มลิงก์ Social Media อื่นๆ */}
          </div>
        </section>

      </div>
    </main>
  );
}