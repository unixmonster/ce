
import ConfigOption from "../config";

class INSTALL_DIR extends ConfigOption {

    private _INSTALL_DIR: string = '';

    public get INSTALL_DIR(): string {
        return this._INSTALL_DIR;
    }


}

export default INSTALL_DIR;
