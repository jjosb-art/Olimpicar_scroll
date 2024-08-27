


export class House {
	constructor(info) {
		this.x = info.x;
		this.z = info.z;

		this.height = info.height || 2;

		info.gltfLoader.load(
			info.modelSrc,
			glb => {
				console.log(glb);
				this.mesh = glb.scene;
				this.mesh.castShadow = true;
				this.mesh.position.set(this.x, this.height/2, this.z);
				// this.mesh.scale.set(0.0065, 0.0065, 0.0065);
				this.mesh.scale.set(0, 0, 0);
				info.scene.add(this.mesh);
			}
		);
	}
}