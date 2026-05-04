class ComponentsTreeEngine {
    private components: any[] = [];

    private static instance: ComponentsTreeEngine;
    private constructor() {}
    public static getInstance() {
        if (!ComponentsTreeEngine.instance) {
            ComponentsTreeEngine.instance = new ComponentsTreeEngine();
        }
        return ComponentsTreeEngine.instance;
    }

    public addComponent(component) {
        this.components.push(component);
    }
}

export default ComponentsTreeEngine.getInstance();
