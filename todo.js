const todo = {
    MSG_NO_CONTENT: '내용을 입력하세요.',
    todoList: [],
    todo__input: null,
    li__additional: null,
    list: null,
    list__items: null,
    init() {
        // todo 추가 input
        this.li__additional = document.querySelector('ul.list li.additional');
        this.todo__input = this.li__additional.querySelector('.todo__box input');

        // todo list 초기화
        this.list = document.querySelector('ul.list');
        this.initTodos();

        // dragevent
        if (this.todoList.length > 0) {
            this.sortable();
        }

        // 로컬 스토리지에서 todo filter를 가져옴
        this.setFilter(this.getFilterFromLocal());
        
        this.todo__input.focus();
        this.todo__input.addEventListener('keydown', (e) => {
            if (e.key == 'Enter') {
                this.addTodoItem();
            }
        });

    },
    getFilterFromLocal() {
        return localStorage.getItem('todo_filter') ?? 'all';
    },
    getTodoListFromLocal() {
        return localStorage.getItem('todo_list');
    },
    getFilterFromDocument() {
        let filter = 'all';
        document.querySelectorAll('ul.filter li').forEach(item => {
            if (item.classList.contains('active')) {
                filter = item.classList[0];
            }
        })

        return filter;
    },
    updateLocalStorage() {
        localStorage.setItem('todo_filter', this.getFilterFromDocument());
        localStorage.setItem('todo_list', JSON.stringify(this.todoList));
    },
    initTodos() {
        // 로컬 스토리지에서 todo list를 가져옴
        const localData = this.getTodoListFromLocal();
        if (localData) {
            let todoList = JSON.parse(localData);
            todoList.forEach(data => {
                this.drawTodoBox(data);
            })
            this.todoList = todoList;
            this.list__items = this.list.querySelectorAll('li');
        }
    },
    /**
     * 전체 or 미완료 or 완료 필터를 설정
     * @param {'all' || 'incomplete' || 'completed'} filter 
     */
    setFilter(filter) {
        document.querySelectorAll('ul.filter li, ul.list li').forEach(item => item.classList.remove('active'));
        document.querySelector(`ul.filter li.${filter}`).classList.add('active');

        if (filter == 'all') {
            document.querySelectorAll('ul.list li:not(.hidden)').forEach(item => item.classList.add('active'));
            this.show(this.li__additional);
        } else {
            document.querySelectorAll(`ul.list li.${filter}`).forEach(item => item.classList.add('active'));
            if (filter == 'completed') {
                this.hide(this.li__additional);
            } else {
                this.show(this.li__additional);
            }
        } 

        this.updateLocalStorage();
    },
    /**
     * todo list에 todo를 추가
     * @param data { se: 'additional' || 'completed' || 'incomplete',
     *               id: 'todo_${timestamp}',
     *               content: '할일 내용' }
     */
    drawTodoBox(data) {
        // list ul에 li를 추가
        let li = document.createElement('li');
        document.querySelector('ul.list>li.additional').insertAdjacentElement('beforebegin', li);
        li.classList.add(data.se);
        li.draggable = 'true';
        li.id = data.id;

        // ul>li에 todo__box div를 추가
        let todo__box = document.createElement('div');
        todo__box.className = `todo__box`;
        li.appendChild(todo__box);

        // 완료/미완료 표시용 checkbox 추가
        let todo__check = document.createElement('input');
        todo__check.type = 'checkbox';
        if (data.se == 'completed') todo__check.checked = true;
        todo__check.addEventListener('click', (e) => this.onClickCheckbox(e.target));
        todo__box.appendChild(todo__check);

        // 할일 내용 추가
        let todo__content = document.createElement('input');
        todo__content.value = data.content;
        todo__content.addEventListener('change', (e) => {
            let content = e.target.value;
            let origContent = this.todoList.filter(item => item.id == data.id)[0].content;

            if (this.isEmpty(content)) {
                e.target.value = origContent;
            } else {
                this.todoList.filter(item => item.id == data.id)[0].content = content;
                this.updateLocalStorage();
            }

            this.todo__input.focus();
        })
        todo__box.appendChild(todo__content);

        // 삭제 버튼 추가
        let todo__btn = document.createElement('button');
        todo__btn.textContent = 'x';
        todo__btn.addEventListener('click', (e) => this.onClickDeleteBtn(e.target));
        todo__box.appendChild(todo__btn);

        this.todo__input.focus();
    },
    /**
     * todoList에 todo obj를 추가하고 로컬 스토리지 업데이트 
     */
    addTodoItem() {
        let content = this.todo__input.value;
        if (this.isEmpty(content)) {
            alert(this.MSG_NO_CONTENT);
            return false;
        }
        
        let today = new Date();
        let timestamp = today.getTime();

        let data = {
            se: 'incomplete',
            id: `todo_${timestamp}`,
            content: content
        }
        
        this.drawTodoBox(data);
        this.todoList.push(data);
        
        this.setFilter(this.getFilterFromDocument());
        this.updateLocalStorage();
        this.clearTodoInput();
        this.list__items = this.list.querySelectorAll('li');
        this.sortable(this.list);
    },
    clearTodoInput() {
        this.todo__input.value = '';
        this.todo__input.focus();
    },
    onClickCheckbox(checkbox) {
        let parent__li = checkbox.parentElement.parentElement;
        let se;
        if (checkbox.checked) {
            se = 'completed';
            parent__li.classList.remove('incomplete');
            parent__li.classList.add('completed');
        } else {
            se = 'incomplete';
            parent__li.classList.remove('completed');
            parent__li.classList.add('incomplete');
        }

        this.todoList.forEach(item => {
            if (item.id == parent__li.id) {
                item.se = se;
            }
        })

        this.setFilter(this.getFilterFromDocument());
        this.updateLocalStorage();
    },
    onClickDeleteBtn(btn) {
        let parent__li = btn.parentElement.parentElement;
        this.todoList = this.todoList.filter(item => item.id != parent__li.id);

        parent__li.parentElement.removeChild(parent__li);
        this.updateLocalStorage();
    },
    sortable() {
        let list = this.list;
        let list__items = this.list__items;
        let drag__item;

        list.addEventListener('dragstart', (e) => {
            drag__item = e.target;
        
            list.addEventListener('dragover', onDragOver);
            list.addEventListener('dragend', onDragEnd);

            setTimeout(() => {
                drag__item.classList.add('ghost');
            }, 0)
        });
        
        function onDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const target = e.target;

            if(target && target !== drag__item && (target.tagName === 'DIV' || target.tagName === 'INPUT')) {
                const parent = target.parentElement.tagName === 'LI' ? target.parentElement : target.parentElement.parentElement;
                if (parent.tagName === 'LI') {
                    const offset = getMouseOffset(e);
                    const middleY = getElementVerticalCenter(parent);
                    const targetIdx = [].indexOf.call(list__items, parent);
                    if (offset.y > middleY) {
                        targetIdx !== -1 && list.insertBefore(drag__item, parent.nextSibling);
                    } else{
                        targetIdx !== -1 && list.insertBefore(drag__item, parent);
                    }
                }
            }
        }

        function onDragEnd(e) {
            e.preventDefault();
            drag__item.classList.remove('ghost');
            list.removeEventListener('dragover', onDragOver);
            list.removeEventListener('dragend', onDragEnd);
        }

        function getMouseOffset(e) {
            const targetRect = e.target.getBoundingClientRect();
            const offset = {
                x: e.pageX - targetRect.left,
                y: e.pageY - targetRect.top,
            }
            return offset;
        }

        function getElementVerticalCenter(el) {
            const rect = el.getBoundingClientRect();
            return (rect.bottom - rect.top);
        }
    },
    isEmpty(string) {
        return string == undefined || string.trim() == '' || string.length == 0;
    },
    show(element) {
        element.classList.remove('hidden');
    },
    hide(element) {
        element.classList.add('hidden');
    }

}

window.addEventListener("DOMContentLoaded", () => {
    todo.init();
})