'use client'

import {useEffect} from "react";
import {CuboidEditor} from "@/lib/CuboidEditor";

export default function Editor() {
    useEffect(() => {
        console.log('Entered')
        let cuboidEditor: CuboidEditor | null = new CuboidEditor(window);
        cuboidEditor.startAnimation();
        cuboidEditor.loadPCDtoScene();

        return () => {
            cuboidEditor?.deleteEverything();
            cuboidEditor = null;
        }
    }, [])

    return (
        <div>
            <canvas id="main" className='h-[100vh] w-[100%]'></canvas>
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