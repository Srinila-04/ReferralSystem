import { Job } from "../models/associations.js";

export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      location,
      experience,
    } = req.body;

    if (!title || !description || !department || !location) {
      return res.status(400).json({
        message: "Title, description, department and location are required",
      });
    }

    const job = await Job.create({
      title,
      description,
      department,
      location,
      experience,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    console.error("Create job error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.findAll({
      where: {
        status: "open",
      },
    });

    res.status(200).json({
      jobs,
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json({
      job,
    });
  } catch (error) {
    console.error("Get job by ID error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      department,
      location,
      experience,
    } = req.body;

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.status === "closed") {
      return res.status(400).json({
        message: "Cannot update a closed job",
      });
    }

    await job.update({
      title: title ?? job.title,
      description: description ?? job.description,
      department: department ?? job.department,
      location: location ?? job.location,
      experience: experience ?? job.experience,
    });

    return res.status(200).json({
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    console.error("Update job error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const closeJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.status === "closed") {
      return res.status(400).json({
        message: "Job is already closed",
      });
    }

    await job.update({
      status: "closed",
    });

    return res.status(200).json({
      message: "Job closed successfully",
      job,
    });
  } catch (error) {
    console.error("Close job error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};
