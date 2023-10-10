/**
 * An Task Object
 */
class Task {
  /**
   * @param {Object} task, with appropriate fields of a task
   */
  constructor(task) {
    this['due-date'] = this.formatDate(new Date(task['due-date']));
    this.title = task.title;
    this.description = task.description;
    this.priority = task.priority;
    this.pinned = task.pinned;
    this.tags = task.tags;
    this.progress = task.progress;
  }

  /**
   * TODO: this function tests if the Task has the given tag
   * @param {String} tag, the given single tag to be checked
   */
  hasTag(tag) {
    return this.tags.includes(tag);
  }

  /**
   * this function convert a Date Object to a "yyyy-mm-dd" format string
   * @param {Date} date
   * @return {String} "yyyy-mm-dd" format string
   */
  formatDate(date) {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Adding 1 because getUTCMonth() is zero-based
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
}

export {
  Task,
};
