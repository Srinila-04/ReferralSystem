
const escapeHtml = (value = "") => {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
};

export const shortlistedTemplate = ({ candidateName, jobTitle }) => {
  return {
    subject: `Update on your application for ${jobTitle}`,
    html: `
      <p>Dear ${escapeHtml(candidateName)},</p>
      <p>We are pleased to inform you that you have been shortlisted for
      <strong>${escapeHtml(jobTitle)}</strong>.</p>
      <p>Our HR team will contact you with the next steps.</p>
      <p>Regards,<br>HR Team</p>
      <p>GWC Data.AI</p>
    `,
  };
};

export const rejectedTemplate = ({
  candidateName,
  jobTitle,
  reason = "",
}) => {
  return {
    subject: `Update on your application for ${jobTitle}`,
    html: `
      <p>Dear ${escapeHtml(candidateName)},</p>
      <p>Thank you for your interest in
      <strong>${escapeHtml(jobTitle)}</strong>.
      After careful consideration, we will not be moving forward
      with your application at this time.</p>
      ${
        reason.trim()
          ? `<p>Reason: ${escapeHtml(reason)}</p>`
          : ""
      }
      <p>Regards,<br>HR Team</p>
    `,
  };
};
