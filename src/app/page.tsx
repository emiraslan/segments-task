import {SparklesPreview} from "@/components/SparklesPage";
import { Button } from "@/components/ui/button"
import Link from "next/link";

export default function Home() {

  return (
    <main className="dark flex min-h-screen flex-col items-center justify-center p-24 bg-black">
      <SparklesPreview />
        <div className='flex w-[40rem] justify-center'>
            <Button className='mx-3'>
                <a className='px-3 h-10 leading-10' target='_blank'
                   href="https://github.com/emiraslan/segments-task">
                    Open
                    source code
                </a>
            </Button>
            <Button className='mx-3'>
                <Link className='px-3 h-10 leading-10' href="/editor">Load the project</Link>
            </Button>
        </div>
    </main>
  );
}
