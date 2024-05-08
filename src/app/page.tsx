import {SparklesPreview} from "@/components/SparklesPage";
import { Button } from "@/components/ui/button"
import Link from "next/link";

export default function Home() {

  return (
    <main className="dark flex min-h-screen flex-col items-center justify-center p-24 bg-black">
      <SparklesPreview />
        <div className='flex w-[40rem] justify-center'>
            <Button className='mx-3'>
                <a target='_blank' href="https://segmentsai.notion.site/Take-home-assignment-2c7bb6cb319b47f18648c384975dd57d?pvs=4">Open assignment description</a>
            </Button>
            <Button className='mx-3'>
                <Link href="/editor">Load the project</Link>
            </Button>
        </div>
    </main>
  );
}
