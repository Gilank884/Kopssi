
function generateDates(tenor) {
    const today = new Date();
    const dates = [];
    for (let i = 1; i <= tenor; i++) {
        // Current logic in LoanDetail.jsx
        const dueDate = new Date(today.getFullYear(), today.getMonth() + i, 15, 12, 0, 0);
        dates.push(dueDate.toISOString());
    }
    return dates;
}

console.log("Tenor 3 starting from", new Date().toISOString());
console.log(generateDates(3));

function generateDatesRobust(tenor) {
    const today = new Date();
    const dates = [];
    for (let i = 1; i <= tenor; i++) {
        const dueDate = new Date(today);
        dueDate.setMonth(today.getMonth() + i);
        dueDate.setDate(15);
        dueDate.setHours(12, 0, 0, 0);
        dates.push(dueDate.toISOString());
    }
    return dates;
}

console.log("\nRobust logic:");
console.log(generateDatesRobust(3));
