class Controller {
    constructor(formIdCreate, formIdUpdate, tableId) {
        this.formEl = document.getElementById(formIdCreate);
        this.formUpdateEl = document.getElementById(formIdUpdate);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();

    }
    //edita os dados
    onEdit() {
        document.querySelector("#box-user-update .btn-cancel").addEventListener("click", e => {
            this.showPanelCreate();
        });
        this.formUpdateEl.addEventListener("submit", event => {
            event.preventDefault();
            let btn = this.formUpdateEl.querySelector("[type=submit]");
            btn.disabled = true;
            let values = this.getValues(this.formUpdateEl);
            let index = this.formUpdateEl.dataset.trIndex;
            let tr = this.tableEl.rows[index];
            let userOld = JSON.parse(tr.dataset.user);
            let result = Object.assign({}, userOld, values);


            this.getPhoto(this.formUpdateEl).then((content) => {
                    if (!values.photo) {
                        result._photo = userOld._photo;
                    } else {
                        result._photo = content;
                    }
                    let user = new User();
                    user.loadFromJSON(result);
                    user.save().then(user=>{
                        this.getTr(user, tr);
                        this.updateCount();
                        this.formUpdateEl.reset();
                        btn.disabled = false;
                        this.showPanelCreate();
                    });
                    
                },
                (e) => {
                    console.error(e);
                });
        });
    }
    //botão salvar formulario
    onSubmit() {

        this.formEl.addEventListener("submit", event => {
            //não deixa a tela atualizar após enviar o formulário
            event.preventDefault();
            let btn = this.formEl.querySelector("[type=submit]");
            btn.disabled = true;
            let values = this.getValues(this.formEl);
            if (!values) return false;
            this.getPhoto(this.formEl).then((content) => {
                    values.photo = content;
                    values.save().then(user=>{
                    this.addLine(user);
                    this.formEl.reset();
                    btn.disabled = false;
                    });
                    
                },
                (e) => {
                    console.error(e);
                });

        });

    }
    //selecionar foto
    getPhoto(formEl) {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            let elements = [...formEl.elements].filter(item => {
                if (item.name === "photo") {
                    return item;
                }

            });


            let file = elements[0].files[0];

            fileReader.onload = () => {
                resolve(fileReader.result);
            };
            fileReader.onerror = (e) => {
                reject(e);
            };
            if (file) {
                fileReader.readAsDataURL(file);
            } else {
                //imagem padrão
                resolve('dist/img/boxed-bg.jpg');
            }
        });
    }

    getValues(formEl) {

        let user = {};
        let isValid = true;
        //spread(...)
        [...formEl.elements].forEach(function (field, index) {
            if (["name", "email", "password"].indexOf(field.name) > -1 && !field.value) {
                //parentElement pega o elemento pai, classList lista as classes e add adiciona uma nova classe
                //validação de formulario fields nome, email e senha
                field.parentElement.classList.add("has-error");
                isValid = false;
            }

            if (field.name == "gender") {
                if (field.checked) {
                    user[field.name] = field.value;
                }

            } else if (field.name == 'admin') {
                user[field.name] = field.checked;

            } else {
                user[field.name] = field.value;
            }


        });

        if (!isValid) {
            return false;
        }
        //objeto objectUser representa a classe User
        return new User(user.name,
            user.gender,
            user.birth,
            user.country,
            user.email,
            user.password,
            user.photo,
            user.admin
        );


    }
    /*getUsersStorage() {
        let users = [];
        if (localStorage.getItem("users")) {
            users = JSON.parse(localStorage.getItem("users"));
        }
        return users;
    }
   */ 
    //seleciona os dados já salvos no localStorage
    selectAll() {
        //let users = User.getUsersStorage();
        User.getUsersStorage().then(data=>{
            data.users.forEach(dataUsers => {
                let user = new User();
                user.loadFromJSON(dataUsers);
                this.addLine(user);
            });
        });
        
    }
    //adiciona linha na tabela
    addLine(dataUsers) {
        let tr = this.getTr(dataUsers);


        this.tableEl.appendChild(tr);
        this.updateCount();
    }
    //cria nova linha no template
    getTr(dataUsers, tr = null) {
        if (tr === null) tr = document.createElement('tr');
        tr.dataset.user = JSON.stringify(dataUsers);
        tr.innerHTML =
            `<tr>
    <td>
    <img src=${dataUsers.photo} alt="User Image" class="img-circle img-sm">
    </td>
    <td>${dataUsers.name}</td>
    <td>${dataUsers.email}</td>
    <td>${(dataUsers.admin)?"Sim": "Não"}</td>
    <td>${Utils.dateFormat(dataUsers.register)}</td>
    <td>
      <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
      <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
    </td>
    </tr>`;
        this.addEventsTr(tr);
        return tr;
    }
    //eventos do botão editar e excluir da linha na tabela
    addEventsTr(tr) {
        tr.querySelector(".btn-delete").addEventListener('click', (e) => {
            if (confirm("Deseja realmente excluir?")) {
                let user = new User();
                user.loadFromJSON(JSON.parse(tr.dataset.user));
                user.delete().then(data =>{
                    tr.remove();
                    this.updateCount();
                });
               
            }
        });
        tr.querySelector(".btn-edit").addEventListener('click', e => {
            let json = JSON.parse(tr.dataset.user);
            this.formUpdateEl.dataset.trIndex = tr.sectionRowIndex;
            for (let name in json) {
                let field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "]");

                if (field) {

                    switch (field.type) {
                        case 'file':
                            continue;
                            break;

                        case 'radio':
                            field = this.formUpdateEl.querySelector("[name=" + name.replace("_", "") + "][value=" + json[name] + "]");
                            field.checked = true;
                            break;
                        case 'checkbox':
                            field.checked = json[name];
                            break;
                        default:
                            field.value = json[name];
                    }

                }

            }
            this.formUpdateEl.querySelector(".photo").src = json._photo;
            this.showPanelUpdate();
        });

    }
    //aparecer o formulario de criação de usuario e esconder o formulario de edição de usuario
    showPanelCreate() {
        document.querySelector("#box-user-create").style.display = "block";
        document.querySelector("#box-user-update").style.display = "none";
    }
    ////aparecer o formulario de edicao de usuario e esconder o formulario de criação de usuario
    showPanelUpdate() {
        document.querySelector("#box-user-create").style.display = "none";
        document.querySelector("#box-user-update").style.display = "block";
    }
    //atualiza o contador de usuario e administradores
    updateCount() {
        let numberUsers = 0;
        let numberAdmin = 0;
        [...this.tableEl.children].forEach(tr => {
            numberUsers++;
            let user = JSON.parse(tr.dataset.user);
            if (user._admin) numberAdmin++;
        });
        document.querySelector("#number-users").innerHTML = numberUsers;
        document.querySelector("#number-users-admin").innerHTML = numberAdmin;
    }

}