import Team from "../models/teams.model";


export const createTeam = async (req, res) => {
    try {
        const { name,img } = req.body
        const newTeam = new Team({ name,img })
        if (req.file) {
            const { filename } = req.file;
            newTeam.setImgUrl(filename)
        }
        const newTeamSaved = await newTeam.save();
        res.status(200).json(newTeamSaved)
    } catch (error) {

    }
}

export const getAllTeams = async (req, res) => {
    try {
        const allTeams = await Team.find()
        res.status(200).json(allTeams)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}


export const getTeamById = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id)
        res.status(200).json(team)
    } catch (error) {
        res.status(400).json({ messagge: error })
    }
}



export const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, img } = req.body;

        // Busco el team
        const team = await Team.findById(id);
        if (!team) {
            return res.status(404).json({ message: "Team no encontrado" });
        }

        // Actualizo campos
        if (name) team.name = name;
        if (img) team.img = img;

        // Si se subió una nueva imagen
        if (req.file) {
            const { filename } = req.file;
            team.setImgUrl(filename);
        }

        const updatedTeam = await team.save();

        res.status(200).json(updatedTeam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export const deleteTeam = async (req,res) => {
    try {
        const deletedTeam = await Team.findByIdAndDelete(req.params.id)
        res.status(200).json({messagge:'eliminado correctamente'})
    } catch (error) {
        res.status(400).json({error:error.messagge})
    }
}