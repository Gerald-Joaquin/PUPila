/**
 * lib/knowledge.ts
 *
 * Curated enrollment knowledge base for CampusAssist AI.
 * Edit the content fields freely — the AI uses this as its sole source of truth.
 * Never add external URLs or hallucinated data here.
 *
 * Any text containing [UPDATE THIS] is a placeholder. The AI must NOT guess
 * these details; it should say it doesn't have them and refer the student
 * to the department or Registrar's Office.
 */

export interface KnowledgeEntry {
  topic: string
  content: string
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    topic: "Glossary of Terms",
    content: `
- COR (Certificate of Registration): Proof that a student is officially enrolled. It is available in the student's PUPSIS account after the department confirms and tags the subjects.
- PUPSIS: The university's student information system where the COR is kept.
- ENR number: The tracking number given after submitting an enrollment in the portal. Used on the Track page to check status.
- Tagging: When the department assigns the confirmed subjects to the student's record. A student is officially enrolled only after tagging.
- Admin / Department / Chairperson: The staff who review, approve and tag enrollments.
- Regular student: Follows the standard curriculum for their program and year level, with no back subjects.
- Irregular student: Has back subjects, is a re-admission student, or otherwise cannot follow the standard subject load.
- Back subject: A subject the student was supposed to take earlier but failed, dropped, or did not take.
- Re-admission student: A student returning to the university after a lapse, who must complete the re-admission process first.
`,
  },
  {
    topic: "Enrollment Types Overview",
    content: `
There are four enrollment situations:
1. Regular student: subjects are auto-assigned based on program and year level, then confirmed by the department.
2. Irregular student, re-admission: the AI evaluates past subjects and suggests what to take. A limited number of units applies. The chairperson must approve.
3. Irregular student with back subjects (formerly a regular student): the AI evaluates the account and suggests subjects. The chairperson must approve.
4. Regular student who needs a different schedule (work or personal reasons): the AI helps find schedules that fit the student's situation.
`,
  },
  {
    topic: "How to Enroll",
    content: `
To enroll for the current semester:
1. Go to the Enrollment page on the CampusAssist portal and click Enroll now.
2. Choose your student type: Regular or Irregular.
3. Fill in your full name, student ID, year level and program.
4. Follow the steps for your student type (see the topics "Regular Student Enrollment Process" and "Irregular Student Enrollment Process").
5. After submitting, you will receive an Enrollment Number (ENR). Save it to track your status.
6. Your enrollment becomes official only after the department confirms and tags your subjects.
`,
  },
  {
    topic: "Regular Student Enrollment Process",
    content: `
Steps for a regular student:
1. Upload your COR (optional). This is only needed if you already enrolled in some of this semester's subjects. The AI reads it so only the remaining subjects are added.
2. If you did not enroll during the online enrollment period set in the university calendar, your subjects for the semester are automatically assigned based on your program and year level. You do not need to pick subjects.
3. AI verification: the AI checks that the subjects are correct. Once all subjects are verified, they are filled in automatically on the department's required form.
4. Submit the form. You receive an ENR number.
5. Department review: the admin (department) confirms your form and tags your subjects.
6. Result: you are officially enrolled, and your COR is available in your PUPSIS account.

Notes:
- Uploading a COR is optional. If you skip it, you get the full auto-assigned subject list.
- Subjects shown before the department confirms and tags them are not final.
`,
  },
  {
    topic: "Irregular Student Enrollment Process",
    content: `
There are two kinds of irregular students.

A) Re-admission students
1. Complete the required re-admission process first. [UPDATE THIS — which offices and documents are required.]
2. Your back subjects are tagged.
3. The AI evaluates the subjects you took in the past and sends you a list of subjects you still need to take.
4. Re-admission students can only take a LIMITED number of units per semester. [UPDATE THIS — the unit limit.] You can ask the AI Assistant which subjects are best to take within that limit.
5. When you are satisfied with the AI's suggestion, or after making your own decision, choose your desired subjects for the semester and fill in the department's required form.
6. The chairperson checks whether your request is valid.
7. Once approved and tagged by the department, you can download the approved form.
8. The next steps of re-admission are beyond what this portal covers. Please ask the Registrar's Office or your department about them.

B) Irregular students with back subjects (formerly regular)
1. Start Irregular Enrollment and fill in your details.
2. The AI evaluates your account and lists the subjects you can take this semester.
3. You can ask the AI Assistant which subjects are best to take this term, for example by balancing back subjects with current-year subjects, prerequisites and your unit load.
4. When you are satisfied with the suggestion, or after making your own decision, choose your subjects and fill in the department's required form.
5. The chairperson checks whether your request is valid.
6. Once approved and tagged by the department, you are officially enrolled and your COR is available in your PUPSIS account.

The AI's suggestions are advice only. The final choice is yours, and the chairperson's approval is required.
`,
  },
  {
    topic: "Regular vs Irregular Enrollment",
    content: `
Regular Student:
- Follows the prescribed curriculum for their year level and program.
- Subjects are automatically assigned based on program and year level.
- The form is filled in after AI verification, then reviewed by the department. The student is officially enrolled once the department confirms and tags the subjects.

Irregular Student:
- Has back subjects, is a re-admission student, or carries a non-standard subject load.
- The AI evaluates past subjects and suggests what to take. The student can ask the AI Assistant for the best subjects.
- The student chooses subjects and submits the department's form.
- Enrollment status starts as "Pending" and must be approved by the chairperson before it becomes official.
- Re-admission students have a limited number of units per semester.
`,
  },
  {
    topic: "Schedule Change for Regular Students",
    content: `
- Regular students are given a schedule by the department.
- A student with a valid reason to change it (for example a work schedule or personal reasons) can ask the AI Assistant for the schedules that best fit their situation.
- To get good suggestions, the student should describe their available days and times and the reason for the change.
- The AI only suggests options. It cannot change a schedule by itself.
- [UPDATE THIS — whether the department must approve schedule changes, and how to apply.]
`,
  },
  {
    topic: "Subject Recommendations by the AI",
    content: `
The AI Assistant can help students choose subjects, especially irregular and re-admission students with limited units.

What the AI considers:
- Subjects already taken and passed, and back subjects.
- Subjects required for the student's program and year level.
- Prerequisites.
- The student's unit limit.
- Whether the schedules of chosen subjects overlap.

What students should know:
- Suggestions are advice only. The student makes the final decision.
- Irregular enrollments still need the chairperson's approval.
- The AI cannot approve, reject or tag an enrollment.
- If the AI does not have a student's academic records, it can only give general guidance and should ask the student to share the information or contact the department.
`,
  },
  {
    topic: "Required Documents",
    content: `
Please prepare the following before enrolling:
1. Valid School ID or any government-issued ID.
2. Certificate of Registration (COR). Regular students may upload it (optional) if they already enrolled some of this semester's subjects.
3. Official Transcript of Records (for transferees or shiftees).
4. Study load / subject-load request signed by your adviser (for irregular students).
5. Clearance slip from the previous semester (if applicable).
6. 2x2 ID picture (may be required for record updates).
7. Re-admission requirements (for re-admission students): [UPDATE THIS]

Note: Specific requirements may vary — check with the Registrar's Office or Enrollment Office for the latest list.
`,
  },
  {
    topic: "Enrollment Dates and Deadlines",
    content: `
Current Term: 1st Semester, AY 2025-2026.

- Online Enrollment Period: [UPDATE THIS — dates from the university calendar]
- Late Enrollment: [UPDATE THIS — e.g., dates and late fee]
- End of Add/Drop Period: [UPDATE THIS]
- Start of Classes: [UPDATE THIS]

Students who do not enroll during the online enrollment period get their subjects assigned automatically (regular students) or must go through the irregular process.

Important: Late enrollees may be subject to a late enrollment fee. Contact the Registrar's Office for exact dates and fees.
`,
  },
  {
    topic: "Tracking Enrollment Status",
    content: `
To check the status of your enrollment:
1. Go to the "Track My Status" page on the CampusAssist portal.
2. Enter your Enrollment Number (ENR) in the format ENR-XXXXX-MN-0 (regular) or ENR-XXXXX-MN-1 (irregular).
3. Your current status will be displayed: Pending, Confirmed, or Rejected.

Status meanings:
- Pending: Your enrollment has been submitted and is waiting for department or chairperson review.
- Confirmed: The department approved and tagged your subjects. You are officially enrolled, and your COR is available in your PUPSIS account.
- Rejected: Your enrollment was not approved. Please contact the department or Enrollment Office to find out why and what to correct.

Keep your ENR number safe. It is the only way to track your enrollment without visiting the office.
`,
  },
  {
    topic: "Payment Information",
    content: `
Payment details for 1st Semester AY 2025-2026:

- Tuition and miscellaneous fees are assessed per unit and per enrolled subject.
- [UPDATE THIS — e.g., where payment may be made.]
- [UPDATE THIS — accepted payment methods.]
- [UPDATE THIS — scholarship and financial aid instructions.]
- [UPDATE THIS — payment deadline.]

For exact fee schedules and scholarship deductions, contact the Cashier's Office or the Financial Aid Office.
`,
  },
  {
    topic: "Contact and Support",
    content: `
Need help? Contact the following offices:

Registrar's Office:
- [UPDATE THIS — location]
- [UPDATE THIS — office hours]
- [UPDATE THIS — email]
- [UPDATE THIS — phone]

Department / Chairperson's Office (for enrollment approval, tagging and schedules):
- [UPDATE THIS — location and contact]

Enrollment / Student Services Office:
- [UPDATE THIS — location and email]

IT Support (for portal issues):
- [UPDATE THIS — email]

For urgent concerns, visit the Registrar's Office in person during office hours.
`,
  },
  {
    topic: "Common Problems and Solutions",
    content: `
Problem: I submitted my enrollment but didn't receive an ENR number.
Solution: Check if the page loaded a success screen. If not, the submission may not have gone through. Try again or contact the Enrollment Office.

Problem: My status has been "Pending" for several days.
Solution: Enrollments need department or chairperson review. If it has been more than 3–5 business days, contact the department or visit the Enrollment Office with your ENR number.

Problem: My enrollment was rejected.
Solution: Contact the department or visit the Enrollment Office with your ENR number. A staff member will explain the reason and help you fix it.

Problem: I selected the wrong subjects as an irregular student.
Solution: Before the chairperson approves your enrollment, contact the department to request a correction. Once confirmed, changes require a formal add/drop procedure.

Problem: I forgot my ENR number.
Solution: Check the confirmation email or the success screen screenshot you took when you enrolled. If neither is available, contact the Registrar's Office with your student ID.

Problem: I already enrolled some subjects. Will they be duplicated?
Solution: Upload your COR (optional step for regular students). The AI checks it so that only the remaining subjects are added.

Problem: I'm a re-admission student with limited units. What should I take?
Solution: Ask the AI Assistant for the best subjects within your unit limit, then choose your final subjects and submit the form for chairperson approval.

Problem: My regular schedule conflicts with my work.
Solution: Ask the AI Assistant for schedules that fit your availability. [UPDATE THIS — how to apply for a schedule change.]

Problem: The portal is not loading or showing errors.
Solution: Try refreshing the page or using a different browser. If the problem persists, contact IT Support.
`,
  },
  {
    topic: "Subject Load and Units",
    content: `
Standard subject load per semester:
- Regular students: subjects are fully prescribed by the curriculum for their year level.
- Irregular students: may select subjects from other year levels, subject to slot availability, prerequisites and chairperson approval.
- Re-admission students: limited number of units per semester. [UPDATE THIS — exact limit.]
- Irregular students with back subjects: [UPDATE THIS — unit limit, if different.]
- Maximum load: [UPDATE THIS — e.g., units per semester, or as approved by the Dean].
- Minimum load for full-time status: [UPDATE THIS].

Each subject is worth 3 units unless otherwise stated.
`,
  },
  {
    topic: "What the AI Assistant Can and Cannot Do",
    content: `
The AI Assistant CAN:
- Explain each enrollment process step by step.
- Look up an enrollment status when given an ENR number.
- Explain which documents to prepare and what happens next.
- Suggest subjects for irregular and re-admission students based on the student's records, prerequisites and unit limit.
- Suggest schedules that fit a student's availability.

The AI Assistant CANNOT:
- Approve, reject or tag an enrollment. Only the department or chairperson can.
- Guarantee that a suggestion will be approved.
- Issue a COR. It is released through PUPSIS after the department tags the subjects.
- Handle steps outside this portal, such as the later steps of re-admission. Refer students to the Registrar's Office or the department.
- Invent dates, fees, unit limits or policies. If the information is not available, it will say so and refer the student to the proper office.
`,
  },
  {
    topic: "Programs Offered",
    content: `
The CampusAssist AI portal currently supports enrollment for the following programs:
- DCPET — Diploma in Computer Programming and Engineering Technology
- DECET — Diploma in Electrical and Computer Engineering Technology
- DIT    — Diploma in Information Technology
- DOMT   — Diploma in Office Management Technology
- DMET   — Diploma in Mechanical Engineering Technology
- DEET   — Diploma in Electrical Engineering Technology

All programs are offered at PUPILA. For program descriptions and career tracks, contact the Registrar's Office.
`,
  },
]

/**
 * Returns the full knowledge base as a single formatted string,
 * suitable for embedding in a system instruction.
 */
export function getKnowledgeBaseText(): string {
  return KNOWLEDGE_BASE.map(
    (entry) => `### ${entry.topic}\n${entry.content.trim()}`
  ).join("\n\n")
}