const mongoose = require('mongoose');

class EmployeeDB {
	constructor() {
		this.client = mongoose.connect('mongodb+srv://driedl:employeeDB@cluster0.ubjl8.mongodb.net/employeeDB2?retryWrites=true&w=majority');
		this.Employee = mongoose.model('Employee', {
			fName: {
				type: String,
				required: true
			},
			lName: {
				type: String,
				required: true
			},
			id: {
				type: Number,
				required: true,
				unique: true
			},
			payRate: {
				type: Number,
				required: true
			},
			encryptedPassword: {
				type: String,
				required: true
			},
			supervisor: Boolean,
            timecards: Array
		});
	}

	createEmployee(newEmployee) {
		var insertEmployee = new this.Employee({
			fName: newEmployee.fName,
			lName: newEmployee.lName,
			id: newEmployee.id,
			payRate: newEmployee.payRate,
			encryptedPassword: newEmployee.encryptedPassword,
			supervisor: newEmployee.supervisor,
            timecards: []
		});

		return insertEmployee.save();
	}

	createTimecard(databaseId, timecardObject) {
		return this.Employee.findOne({ _id: databaseId }).then((employee) => { 
			employee.timecards.push(timecardObject);

			return employee.save();
		});
	}

    deleteEmployee(databaseId) {
        this.Employee.deleteOne({ _id: databaseId }, (err) => {
            return err;
        });
    }

	deleteTimecard(databaseId, timecardDate) {
		return this.Employee.findOne({ _id: databaseId }).then((employee) => {
			let i = employee.timecards.findIndex(timecard => timecard.date == timecardDate);
			employee.timecards.pop(i);

			return employee.save();
		})
	}

	getEmployee(databaseId) {
		let promise = new Promise((resolve, reject) => {
			this.Employee.findOne({ _id: databaseId }).then((employee) => {
				resolve(employee);
			})
		})
		return promise;
	}

	getEmployeeByEmployeeId(employeeId) {
		let promise = new Promise((resolve, reject) => {
			this.Employee.findOne({ id: employeeId }).then((employee) => {
				resolve(employee);
			})
		})
		return promise;
	}

    updateEmployee(databaseId, updatedEmployeeObject) {
        return this.Employee.findOne({ _id: databaseId }).then((employee) => {
            employee.fName = updatedEmployeeObject.fName;
            employee.lName = updatedEmployeeObject.lName;
            employee.id = updatedEmployeeObject.id;
            employee.payRate = updatedEmployeeObject.payRate;
			employee.supervisor = updatedEmployeeObject.supervisor;

			if(updatedEmployeeObject.encryptedPassword != "") {
				employee.encryptedPassword = updatedEmployeeObject.encryptedPassword;
			}

            return employee.save();
        })
    }

	updateTimecard(databaseId, updatedTimecardObject) {
		return this.Employee.findOne({ _id: databaseId }).then((employee) => {
			for(let i = 0; i < employee.timecards.length; i++) {
				if(employee.timecards[i].date == updatedTimecardObject.date) {
					employee.timecards[i] = updatedTimecardObject;
					break;
				}
			}
			return employee.save();
		})
	}

	getAllEmployees(callback) {
		this.Employee.find().then((employeeList) => {
			callback(employeeList);
		});
	}
}

module.exports = EmployeeDB;
