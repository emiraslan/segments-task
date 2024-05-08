'use client'

import {useEffect} from "react";
import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

export default function Editor() {

    useEffect(() => {

        let pointCloud: any;

        const scene = new THREE.Scene();
        let camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.10, 300 );
        camera.position.x = 50;
        camera.position.z = -100;
        camera.position.y = 50;

        const canvas = document.querySelector('#main') as HTMLCanvasElement;
        const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
        renderer.setSize( window.innerWidth, window.innerHeight );

        const controls = new MapControls( camera, renderer.domElement );
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;

        controls.minDistance = 1;
        controls.maxDistance = 500;

        controls.maxPolarAngle = Math.PI / 2;
        controls.update();

        const axesHelper = new THREE.AxesHelper( 1 );
        scene.add( axesHelper );

        const loader = new PCDLoader();
        loader.load(
            'https://segmentsai-prod.s3.eu-west-2.amazonaws.com/assets/admin-tobias/41089c53-efca-4634-a92a-0c4143092374.pcd',
            ( points ) => {
                pointCloud = points;
                points.rotation.x = Math.PI / -2;
                points.rotation.z = Math.PI;

                const cnt = points.geometry.getAttribute('position').count;
                const clr = [];
                console.log('Here:' , cnt, points);

                for (let i = 0; i < cnt; i++) {
                    clr.push(...([0.1, 1, 1]).map(e => e * 255));
                }

                points.geometry.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(clr), 3, true));
                points.material.vertexColors = true;
                scene.add( points );
            },
            ( xhr ) => {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            ( error ) => {
                console.log( 'An error happened', error );
            }
        );

        window.addEventListener( "resize", () => {
            camera.aspect = innerWidth/innerHeight;
            camera.updateProjectionMatrix( );
            renderer.setSize( innerWidth, innerHeight );
        });

        const createCuboidButton = document.querySelector('#create-cuboid') as HTMLButtonElement;
        createCuboidButton.addEventListener('click', () => {
            const gui = new GUI();
            const geometry = new THREE.BoxGeometry( 1, 1, 1 );
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });

            const cube = new THREE.Mesh( geometry, material );

            scene.add(cube);

            const dragControls = new DragControls([cube], camera, renderer.domElement);

            dragControls.addEventListener( 'drag', function () {
                updateContainedCloudPoints(pointCloud, cube)
            });

            dragControls.addEventListener( 'dragstart', function () {
                controls.enabled = false
                gui.show()
            } );

            dragControls.addEventListener( 'dragend', function () {
                controls.enabled = true
            });

            gui.hide()
            const propertiesFolder = gui.addFolder('Properties');
            propertiesFolder.add( material, 'wireframe' );
            propertiesFolder.open();

            const positionFolder = gui.addFolder('Position');
            positionFolder.add(cube.position, 'x', -20, 20);
            positionFolder.add(cube.position, 'y', -20, 20);
            positionFolder.add(cube.position, 'z', -20, 20);
            positionFolder.close();

            const scaleFolder = gui.addFolder('Scale');
            scaleFolder.add(cube.scale, 'x', 0, 15);
            scaleFolder.add(cube.scale, 'y', 0, 15);
            scaleFolder.add(cube.scale, 'z', 0, 15);
            scaleFolder.close();

            const rotationFolder = gui.addFolder('Rotation');
            rotationFolder.add(cube.rotation, 'x', 0, Math.PI * 2);
            rotationFolder.add(cube.rotation, 'y', 0, Math.PI * 2);
            rotationFolder.add(cube.rotation, 'z', 0, Math.PI * 2);
            rotationFolder.close();

            const element = document.querySelector('#cuboid-container') as HTMLDivElement;
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        })

        function animate() {
            requestAnimationFrame( animate );
            controls.update();
            renderer.render( scene, camera );
        }

        function updateContainedCloudPoints(points: any, cubeMesh: THREE.Mesh) {
            const cnt = points.geometry.getAttribute('position').count;
            const positionArray = points.geometry.getAttribute('position').array;
            const clr = [];

            const bb = new THREE.Box3();
            bb.setFromObject(cubeMesh);

            for (let i = 0; i < cnt; i++) {
                if (
                    bb.containsPoint(new THREE.Vector3(-1 * positionArray[i * 3], positionArray[i * 3 + 2], positionArray[i * 3 + 1]))
                ) {
                    clr.push(...([1, 1, 0.1]).map(e => e * 255));
                } else {
                    clr.push(...([0.1, 1, 1]).map(e => e * 255));
                }
            }

            points.geometry.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(clr), 3, true));
        }

        animate()
    })

    return (
        <div>
            <canvas id="main" className='h-[100vh] w-[100%]'></canvas>
            <div id='cuboid-container' className='fixed top-20 left-1/2 dark'>
                <button
                    id="create-cuboid"
                    className='inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mx-3'
                >
                    Create a cuboid
                </button>
            </div>
        </div>
    )
}