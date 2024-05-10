'use client'

import {useEffect, useState} from "react";
import { Progress } from "@/components/ui/progress"
import {CuboidEditor} from "@/lib/CuboidEditor";

export default function Editor() {
    const [isLoading, setIsLoading] = useState(false)
    const [progress, setProgress] = useState<number>(0)

    const progressLoading = (value: number) => {
        setProgress(value)
    }

    useEffect(() => {
        setIsLoading(true)
        let cuboidEditor: CuboidEditor | null = new CuboidEditor(window);
        cuboidEditor.startAnimation();
        cuboidEditor.loadPCDtoScene(progressLoading).then(() => {
            setIsLoading(false)
        });

        return () => {
            cuboidEditor?.deleteEverything();
            cuboidEditor = null;
        }
    }, [])


    return (
        <div>
            <canvas id="main" className='h-[100vh] w-[100%]'></canvas>
            { isLoading &&
                <div className='fixed top-[40%] dark inset-x-0 mx-auto w-[50%]'>
                    <p className='text-white text-lg font-light'>Data is loading...</p>
                    <Progress value={progress}/>
                </div>
            }
            <div id='cuboid-container' className='fixed bottom-20 dark inset-x-0 mx-auto w-fit'>
                <button
                    id="create-cuboid"
                    className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2'
                >
                    Create a cuboid
                </button>
            </div>
        </div>
    )
}