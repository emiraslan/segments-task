
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {wait} from "@/lib/utils";

export class CuboidEditor {
    // Creating user interface
    gui: GUI;

    // This is for creating unique id for each cuboid
    private static cuboidIndexCounter: number = 0

    // Array of all created cuboids
    readonly cuboids: THREE.Mesh[] = []

    // ID of selected cuboid
    selectedCuboidID : number = 0;

    // Create cameras and adjust properties
    currentCamera: THREE.OrthographicCamera | THREE.PerspectiveCamera
    readonly cameraOrtho: THREE.OrthographicCamera
    readonly cameraPersp: THREE.PerspectiveCamera

    // Create the scene
    readonly scene: THREE.Scene;

    // Attach camera to existing canvas with proper dimensions
    readonly canvas: HTMLCanvasElement;
    readonly renderer: THREE.WebGLRenderer;

    // Add controls to camera for navigation
    readonly controls: OrbitControls;

    // Parsed PCD data will be stored here
    pointCloud: any;

    constructor(window: Window) {
        // Creating user interface
        this.gui = new GUI();

        // Create the scene
        this.scene = new THREE.Scene();

        // Create the came and adjust properties
        this.cameraPersp = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 300 );
        this.cameraOrtho = new THREE.OrthographicCamera( - 5 * (window.innerWidth / window.innerHeight), 5 * (window.innerWidth / window.innerHeight), 5, -5, 0.1, 100 );
        this.currentCamera = this.cameraPersp;

        this.currentCamera.position.x = 50;
        this.currentCamera.position.z = -100;
        this.currentCamera.position.y = 50;

        // Attach camera to existing canvas with proper dimensions
        this.canvas = window.document.querySelector('#main') as HTMLCanvasElement;
        this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.canvas});
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        // Keeping proper screen dimensions in case of resize event
        window.addEventListener( "resize", () => {
            const aspect = window.innerWidth / window.innerHeight;

            this.cameraPersp.aspect = aspect;
            this.cameraPersp.updateProjectionMatrix();

            this.cameraOrtho.left = this.cameraOrtho.bottom * aspect;
            this.cameraOrtho.right = this.cameraOrtho.top * aspect;
            this.cameraOrtho.updateProjectionMatrix();

            this.renderer.setSize( window.innerWidth, window.innerHeight );
        });

        // Add controls to camera for navigation
        this.controls = new OrbitControls(this.currentCamera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;

        this.controls.minDistance = 1;
        this.controls.maxDistance = 500;

        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.update();

        // Add axes helper to make finding axis directions and orientations easily
        const axesHelper = new THREE.AxesHelper( 1 );
        this.scene.add( axesHelper );

        window.addEventListener( 'keydown',  ( event ) => {
            switch ( event.key ) {
                case 'c':
                    const position = this.currentCamera.position.clone();

                    this.currentCamera = (this.currentCamera as any).isPerspectiveCamera ? this.cameraOrtho : this.cameraPersp;
                    this.currentCamera.position.copy( position );

                    this.controls.object = this.currentCamera;
                    // control.camera = currentCamera;

                    this.currentCamera.lookAt( this.controls.target.x, this.controls.target.y, this.controls.target.z );
                    break;
            }
        })

        // Orientation manager
        const gltfLoader = new GLTFLoader()
        // Load a glTF resource
        gltfLoader.load(
            // resource URL
            '3d-models/axis-xyz.glb',
            // called when the resource is loaded
             ( gltf ) => {
                // Resizing
                gltf.scene.scale.set(0.1, 0.1, 0.1)

                 // Assigning material to each dimensions
                 gltf.scene.children.forEach(it => {
                     let currentColor: number;
                     if (it.name === 'Right') {
                         currentColor = 0xff1111
                     } else if (it.name === 'Left') {
                         currentColor = 0x1111ff
                     } else if (it.name === 'Up') {
                         currentColor = 0x11ff11
                     } else {
                         currentColor = 0xffffff
                     }

                     (it as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: currentColor })
                 })

                this.scene.add(gltf.scene);

                /// TODO: Attach it to the corner of the screen
             },
            // called while loading is progressing
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            function ( error ) {
                console.log( 'An error happened', error );
            }
        );

        // Adding drag controls
        const dragControls = new DragControls(this.cuboids, this.currentCamera, this.renderer.domElement);
        dragControls.addEventListener( 'drag',  (e) => {
            this.updateContainedCloudPoints(this.pointCloud, e.object as THREE.Mesh)
        });
        dragControls.addEventListener( 'dragstart', (e) => {
            // Disabling camera controls, so that it wouldn't confuse cube and camera movement
            this.controls.enabled = false

            // Extract index and select the cuboid
            this.setSelectedCuboidID(this.getCuboidID(e.object as THREE.Mesh))
        });
        dragControls.addEventListener( 'dragend',  () => {
            // Enabling camera controls when dragging is ended
            this.controls.enabled = true
        });
        dragControls.addEventListener( 'hoveron',  (e) => {
            // Change color when hovered
            if (this.getSelectedCuboid()?.name !== e.object.name) {
                ((e.object as THREE.Mesh).material as any).color.setHex(0xfff11f);
            }
        });
        dragControls.addEventListener( 'hoveroff',  (e) => {
            // Enabling camera controls when dragging is ended
            if (this.getSelectedCuboid()?.name !== e.object.name) {
                ((e.object as THREE.Mesh).material as any).color.setHex(0xffffff);
            }
        });

        // Attaching create-new-cuboid functionality to button click event
        const createCuboidButton = window.document.querySelector('#create-cuboid') as HTMLButtonElement;
        createCuboidButton.addEventListener('click', () => {
            // Creating geometry, material, cube and adding it to the scene and cuboids array
            const geometry = new THREE.BoxGeometry( 1, 1, 1 );
            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            const cube = new THREE.Mesh( geometry, material );
            this.scene.add(cube);
            this.cuboids.push(cube);

            // Naming is important for dragControl and GUI purposes
            cube.name = `Cuboid-${CuboidEditor.cuboidIndexCounter}`

            //  If this is the only cuboid, then select it and change its color
            if (this.cuboids.length === 1) {
                this.setSelectedCuboidID(this.getCuboidID(this.cuboids[0]))
            }

            // Prepare `cuboidIndexCounter` for next new cuboid
            CuboidEditor.cuboidIndexCounter++

            // Update GUI accordingly
            this.updateGUI()
        })
    }

    startAnimation() {
        const animate = () => {
            requestAnimationFrame( animate );
            this.controls.update();
            this.renderer.render( this.scene, this.currentCamera );
        }

        animate()
    }

    updateContainedCloudPoints(points: any, cubeMesh: THREE.Mesh) {
        const cnt = points.geometry.getAttribute('position').count;
        const positionArray = points.geometry.getAttribute('position').array;
        const clr = [];

        const bb = new THREE.Box3();
        bb.setFromObject(cubeMesh);

        for (let i = 0; i < cnt; i++) {
            if (
                bb.containsPoint(new THREE.Vector3(-1 * positionArray[i * 3], positionArray[i * 3 + 2], positionArray[i * 3 + 1]))
            ) {
                clr.push(...([255, 255, 26]));
            } else {
                clr.push(...([255, 255, 255]));
            }
        }

        points.geometry.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(clr), 3, true));
    }

    // Function to update GUI interface when
    //  1. New cuboid is created
    //  2. Other cuboid selected
    updateGUI() {
        // Remove existing one and create new one
        this.gui.destroy();
        this.gui = new GUI();

        // UI Folder element to show all cuboids that are present on the scene
        let sceneItems = this.gui.addFolder('List of cuboids');

        // Add each cuboid with proper names and click events
        this.cuboids.forEach((it,index) => {
            sceneItems.add( {
                select: () => {
                    this.setSelectedCuboidID(this.getCuboidID(it))
                    this.focusCameraToSelectedCuboid(it)
                }
            }, 'select').name(it.name).disable(this.selectedCuboidID === this.getCuboidID(it));
        })
        sceneItems.open();

        // If there is a selected cuboid, then add all main properties
        const selectedCuboid = this.getSelectedCuboid()
        if (selectedCuboid) {
            const onChangeCallBackFunction = (e: number) => this.updateContainedCloudPoints(this.pointCloud, selectedCuboid)

            // Properties - wireframe, visible, remove()
            const propertiesFolder = this.gui.addFolder('Properties');
            // @ts-ignore
            propertiesFolder.add( selectedCuboid.material, 'wireframe');
            propertiesFolder.add( selectedCuboid, 'visible' );
            propertiesFolder.add( {
                remove: () => {
                    const findItemIndex = this.cuboids.findIndex((it) => this.getCuboidID(it) === this.selectedCuboidID);

                    this.scene.remove(this.cuboids[findItemIndex]);
                    this.cuboids.splice(findItemIndex, 1);

                    if (this.cuboids.length) {
                        this.setSelectedCuboidID(this.getCuboidID(this.cuboids[0]));
                    }
                }
            }, 'remove').name(`Remove cuboid`);
            propertiesFolder.open();

            // Position - x, y, z
            const positionFolder = this.gui.addFolder('Position');
            positionFolder.add(selectedCuboid.position, 'x', -20, 20).onFinishChange(onChangeCallBackFunction);
            positionFolder.add(selectedCuboid.position, 'y', -20, 20).onFinishChange(onChangeCallBackFunction);
            positionFolder.add(selectedCuboid.position, 'z', -20, 20).onFinishChange(onChangeCallBackFunction);
            positionFolder.close();

            // Scale - x, y, z
            const scaleFolder = this.gui.addFolder('Scale');
            scaleFolder.add(selectedCuboid.scale, 'x', 0, 15).onFinishChange(onChangeCallBackFunction);
            scaleFolder.add(selectedCuboid.scale, 'y', 0, 15).onFinishChange(onChangeCallBackFunction);
            scaleFolder.add(selectedCuboid.scale, 'z', 0, 15).onFinishChange(onChangeCallBackFunction);
            scaleFolder.close();

            // Rotation - x, y, z
            const rotationFolder = this.gui.addFolder('Rotation');
            rotationFolder.add(selectedCuboid.rotation, 'x', 0, Math.PI * 2).onFinishChange(onChangeCallBackFunction);
            rotationFolder.add(selectedCuboid.rotation, 'y', 0, Math.PI * 2).onFinishChange(onChangeCallBackFunction);
            rotationFolder.add(selectedCuboid.rotation, 'z', 0, Math.PI * 2).onFinishChange(onChangeCallBackFunction);
            rotationFolder.close();
        }
    }

    // Create loader and start loading data from server
    async loadPCDtoScene(setProgress: (value: number) => void) {
        const loader = new PCDLoader();

        // Adding small pause to make progress UI natural
        await wait(500)

        // Fetching PCD data from server asynchronously
        this.pointCloud = await loader.loadAsync(
            'https://segmentsai-prod.s3.eu-west-2.amazonaws.com/assets/admin-tobias/41089c53-efca-4634-a92a-0c4143092374.pcd',
            (xhr) => {
                setProgress(xhr.loaded / xhr.total * 100)
            }
        )

        // Matching cloud data axis orientation with current environment one by rotating
        this.pointCloud.rotation.x = Math.PI / -2;
        this.pointCloud.rotation.z = Math.PI;

        // Algorithm to change the colors of data points
        const cnt = this.pointCloud.geometry.getAttribute('position').count;
        const clr = [];
        for (let i = 0; i < cnt; i++) {
            clr.push(...([255, 255, 255]));
        }
        this.pointCloud.geometry.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(clr), 3, true));
        this.pointCloud.material.vertexColors = true;

        // Add data points to the scene
        this.scene.add(this.pointCloud);

        // Adding small pause to make progress UI natural
        await wait(500)
    }

    // Changing camera properties to view the selected cuboid
    focusCameraToSelectedCuboid(cuboidItem: THREE.Mesh) {
        this.currentCamera.position.copy(cuboidItem.position)
        this.currentCamera.position.x += 5;
        this.currentCamera.position.z += 5;
        this.currentCamera.position.y += 5;
        this.controls.target.set( cuboidItem.position.x, cuboidItem.position.y, cuboidItem.position.z );
    }

    // Access selected cuboid safely
    getSelectedCuboid() {
        if (this.selectedCuboidID < 0 || !this.cuboids.length) {
            return null;
        }
        return this.cuboids.find((it) => this.getCuboidID(it) === this.selectedCuboidID)
    }

    // Set selected cuboid properly
    setSelectedCuboidID(newID: number) {
        this.selectedCuboidID = newID;
        this.cuboids.forEach((cuboidItem, itemIndex) => {
            (cuboidItem?.material as any).color.setHex(this.getCuboidID(cuboidItem) === newID ? 0x33ffff : 0xffffff);
            (cuboidItem?.material as any).opacity = this.getCuboidID(cuboidItem) === newID ? 0.55 : 0.3
        })
        this.updateGUI();
    }

    getCuboidID(cuboidItem: THREE.Mesh): number {
        return parseInt(cuboidItem.name.split('-')[1])
    }

    deleteEverything() {
        this.gui.destroy()
        CuboidEditor.cuboidIndexCounter = 0
    }
}