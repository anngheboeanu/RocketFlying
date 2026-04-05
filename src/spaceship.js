import * as THREE from 'three';


const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b7c8d,       
    metalness: 0.8,
    roughness: 0.4
});

const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2f36,
    metalness: 0.6,
    roughness: 0.6
});

const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.6
});

const emissiveMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    emissive: 0x00aaff,
    emissiveIntensity: 2.0,
    metalness: 0.3,
    roughness: 0.4
});

const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa2222,
    metalness: 0.7,
    roughness: 0.5
});



export function MainBodyGeometry() {
    const scale = 1;

    const mainBodyGeo = new THREE.BoxGeometry(scale * 5.0, scale * 3, scale * 7.0); 
    const topBodyGeo = new THREE.BoxGeometry(scale * 2.5, scale * 1.0, scale * 3.0);
    const sideTopGeo = new THREE.BoxGeometry(scale * 0.5, scale * 0.5, scale * 1.5);
    const frontTopGeo = new THREE.BoxGeometry(scale * 1.75, scale * 0.3, scale * 2.0); 

    const cockpitConnectorGeo = new THREE.BoxGeometry(scale*4.0, scale*2.5, scale*1.5);
    const lowCockpitPartGeo = new THREE.BoxGeometry(scale*3.5, scale*1.25, scale*3.0); 
    const cockpitPartGeo = new THREE.BoxGeometry(scale*2.5, scale*1.0, scale*2.0); 
    
    const longCockpitPartGeo = new THREE.BoxGeometry(scale*1.5, scale*.5, scale*3.0); 
    const upperLongCockpitPatrGeo = new THREE.BoxGeometry(scale*1, scale*1.0, scale*1.0); 


    const mainBox = new THREE.Mesh(mainBodyGeo, hullMaterial);
    const topBox = new THREE.Mesh(topBodyGeo, hullMaterial);
    const sideBoxLeft = new THREE.Mesh(sideTopGeo, panelMaterial);
    const sideBoxRight = new THREE.Mesh(sideTopGeo, panelMaterial);
    const frontTop = new THREE.Mesh(frontTopGeo, hullMaterial);

    // Cockpit should look like glass
    const cockpit = new THREE.Mesh(cockpitPartGeo, glassMaterial);

    // Structural connectors
    const cockpitConnector = new THREE.Mesh(cockpitConnectorGeo, accentMaterial);
    const lowCockpitPart = new THREE.Mesh(lowCockpitPartGeo, panelMaterial);

    // Engine / tail glow
    const longCockpitPart = new THREE.Mesh(longCockpitPartGeo, panelMaterial);
    const upperLongCockpit = new THREE.Mesh(upperLongCockpitPatrGeo, glassMaterial);

    // Access geometry parameters directly
    const mainHeight = mainBodyGeo.parameters.height;
    const mainDepth = mainBodyGeo.parameters.depth;
    const topHeight = topBodyGeo.parameters.height;
    const topDepth = topBodyGeo.parameters.depth;
    const topWidth = topBodyGeo.parameters.width;
    const sideHeight = sideTopGeo.parameters.height;
    const sideDepth = sideTopGeo.parameters.depth;
    const sideWidth = sideTopGeo.parameters.width;
    const frontTopWidth = frontTopGeo.parameters.width;
    const frontTopHeight = frontTopGeo.parameters.height;
    const frontTopDepth = frontTopGeo.parameters.depth;


    const cockpitConnectorWidth = cockpitConnectorGeo.parameters.width;
    const cockpitConnectorDepth = cockpitConnectorGeo.parameters.depth;
    const cockpitConnectorHeight = cockpitConnectorGeo.parameters.height;

    const longPartHeight = lowCockpitPartGeo.parameters.height;
    const cockpitHeight = cockpitPartGeo.parameters.height;
    
    const longCockpitPartDepth = longCockpitPartGeo.parameters.depth;
    

    mainBox.position.set(0, 0, 0);


    cockpitConnector.position.set(
        0,
        0,
        mainDepth/2 + cockpitConnectorDepth/2
    );
    lowCockpitPart.position.set(
        0,-cockpitHeight/2,
        mainDepth/2 + cockpitConnectorDepth+ lowCockpitPartGeo.parameters.depth/2
    );
    
    longCockpitPart.position.set(
        0,
        -cockpitHeight/2 - lowCockpitPartGeo.parameters.height/2 + longCockpitPartGeo.parameters.height/2,
        mainDepth/2 + cockpitConnectorDepth+ lowCockpitPartGeo.parameters.depth  + longCockpitPartGeo.parameters.depth/2 
    );

    upperLongCockpit.position.set(
        0,
        -cockpitHeight/2 - lowCockpitPartGeo.parameters.height/2 + longCockpitPartGeo.parameters.height,
        mainDepth/2 + cockpitConnectorDepth+ lowCockpitPartGeo.parameters.depth  + upperLongCockpitPatrGeo.parameters.depth/2 
    )

    cockpit.position.set(
        0,+cockpitHeight/2,
    mainDepth/2 + cockpitConnectorDepth/2 + cockpitPartGeo.parameters.depth/2
    );

    topBox.position.set(
        0,
        mainHeight / 2 + topHeight / 2,
        -topDepth / 2
    );

    sideBoxLeft.position.set(
        topWidth / 2 + sideWidth / 2,
        mainHeight / 2 + topHeight / 2,
        -topDepth / 2 - sideDepth / 2
    );

    sideBoxRight.position.set(
        -topWidth / 2 - sideWidth / 2,
        mainHeight / 2 + topHeight / 2,
        -topDepth / 2 - sideDepth / 2
    );


    frontTop.position.set(
        0,
        mainHeight / 2 + frontTopHeight / 2,
        +frontTopDepth / 2
    );
    
    const group = new THREE.Group();
    group.add(mainBox, topBox, sideBoxLeft, sideBoxRight, frontTop, cockpitConnector, lowCockpitPart, cockpit, longCockpitPart, upperLongCockpit);
    return group;
}

export function BlockyWingGeometry(orientation)
{
    const scale = 1;

    const mainBoxGeo = new THREE.BoxGeometry(scale * 3.0, scale * 3.0, scale * 8.0); 
    const frontBoxGeo = new THREE.BoxGeometry(scale * 1.5, scale * 2.0, scale * 1.0); 
    const sideBoxGeo = new THREE.BoxGeometry(scale * 1.5, scale * 0.5, scale * 4.0); 
    
    const connectorToMainGeo = new THREE.BoxGeometry(scale*0.25, scale*2.5, scale*4.0); 
    const connectorToMain2Geo = new THREE.BoxGeometry(scale*0.5, scale*2.0, scale*3.5);
    const connectorToMain3Geo = new THREE.BoxGeometry(scale*2., scale*1.25, scale*3.);
    

    const mainBox = new THREE.Mesh(mainBoxGeo, hullMaterial);
    const frontBox = new THREE.Mesh(frontBoxGeo, emissiveMaterial);
    const sideBox = new THREE.Mesh(sideBoxGeo, panelMaterial);

    // Connectors
    const connectorToMain = new THREE.Mesh(connectorToMainGeo, accentMaterial);
    const connectorToMain2 = new THREE.Mesh(connectorToMain2Geo, panelMaterial);
    const connectorToMain3 = new THREE.Mesh(connectorToMain3Geo, hullMaterial);
    const connectorToMain2End = new THREE.Mesh(connectorToMain2Geo, panelMaterial);

    let offsetBack = scale*1.5;
    // Position the boxes next to each other
    mainBox.position.set(0, 0, -offsetBack); // Center
    frontBox.position.set(0, 0,  -(mainBoxGeo.parameters.depth/2 + frontBoxGeo.parameters.depth/2 + offsetBack)); 
    sideBox.position.set(orientation*(mainBoxGeo.parameters.width/2 + sideBoxGeo.parameters.width/2), 0, 0); 

    let totalWidth= mainBoxGeo.parameters.width/2 + connectorToMainGeo.parameters.width/2;
    let side = -1 * orientation
    connectorToMain.position.set(
         side*totalWidth,
        0,
        0
     );
    totalWidth+=connectorToMain2Geo.parameters.width/2;
    connectorToMain2.position.set(
        side*totalWidth,
        0,
        0
     ); 
    totalWidth+= connectorToMain3Geo.parameters.width/2;
    connectorToMain3.position.set(
        side*totalWidth,
        0,
        0
     ); 

    totalWidth+= connectorToMain3Geo.parameters.width/2;
    connectorToMain2End.position.set(
        side*totalWidth,
        0,
        0
     );


    const group = new THREE.Group();
    group.add(mainBox, frontBox,sideBox, connectorToMain,connectorToMain2,connectorToMain3, connectorToMain2End);
    return group;
}




export function SpaceShipMesh() {

    const geometry =  TriangleGeometry();

    
    const material = new THREE.MeshStandardMaterial({
        color: 0x3399ff,
        metalness: 0.2,
        roughness: 0.3,
        flatShading: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    return mesh;


}