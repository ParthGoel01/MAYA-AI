document.addEventListener('DOMContentLoaded',()=>{
    let message = document.getElementById('msg_input');
    let message_i = document.getElementById('message_i');
    let grid = document.querySelector('.content__footer-grid');
    let sidebar=document.querySelector('.sidebar');
    let heading = document.querySelector('.content__main-heading');
    let new_message = document.querySelector('.content__messages');
    let form = document.getElementById('msg_form');

    if(new_message.textContent.trim()!==''){
        grid.style.display='none';
        heading.style.display='none';
        new_message.style.display='flex';
        new_message.scrollTop=new_message.scrollHeight;
        heading.style.justifyContent='flex-start';
    }
    else{
        grid.style.display='grid';
        heading.style.display='flex';
        new_message.style.display='none';
        heading.style.justifyContent='center';
    }

    message.addEventListener('input',()=>{
        if(message.value.trim().length>0){
            message_i.style.backgroundColor="white";
            message_i.style.color="black";
        }
        else{
            message_i.style.backgroundColor="#373636";
            message_i.style.color="#aba9a9";
        }
    });
    
    message.addEventListener('keypress',(event)=>{
        if(event.key==='Enter') event.preventDefault();
        if(event.key==='Enter' && message.value.trim()!==''){
            message_i.click();
        }
    });

    message_i.addEventListener('click',()=>{
        message_i.style.backgroundColor="#373636";
        message_i.style.color="#aba9a9";
        if(message.value.trim()!==''){
            form.submit();
        }
    });

    document.querySelectorAll('.sidebar__chats-span').forEach(chat=>{
        const section = chat.querySelector('.chat_section');
        const dropdown = chat.querySelector('.dropdown-content');
        const dropbtn = section.querySelector('.dropbtn');
        const id = dropbtn.getAttribute('id');

        section.querySelector('.get_section_button').addEventListener('click',(event)=>{
            event.preventDefault();
            if(section.querySelector('.sidebar__chat').hasAttribute('disabled')){
                section.querySelector('.get_form').submit();
            }
        })

        section.addEventListener('mouseenter',()=>{
            dropbtn.style.display='flex';
        })

        section.addEventListener('mouseleave',()=>{
            if(dropdown.classList.contains('show')){
                dropbtn.style.display='flex';
                section.classList.add('show_section');
            }
            else{
                dropbtn.style.display='none';
                section.classList.remove('show_section');
            }
        })
        dropbtn.addEventListener('click',()=>{   
            toggleDropdown(`dropdown${id}`,section);
        });

        dropdown.querySelector('.rename').addEventListener('click',(event)=>{
            event.preventDefault();
            const inputField = section.querySelector('.sidebar__chat');
            inputField.removeAttribute('disabled');
            inputField.focus();
            inputField.addEventListener('keypress', (event) => {
                if(event.key==='Enter'){
                    inputField.setAttribute('disabled', 'true');
                    dropdown.querySelector('.newname_hidden').value=inputField.value;
                    dropdown.querySelector('.rename_form').submit();
                }
            });
        })
        dropdown.querySelector('.delete').addEventListener('click',(event)=>{
            event.preventDefault();
            dropdown.querySelector('.delete_form').submit();
        })
    })  

    document.querySelector('.logout_button').addEventListener('click',()=>{
        document.querySelector('.logout_dropdown').classList.toggle('show');
    })

    function toggleDropdown(dropdownId) {
        var dropdownMenu = document.getElementById(dropdownId);
        dropdownMenu.classList.toggle("show");
    }
    
    window.onclick = function(event) {
        if (!event.target.matches('.dropbtn') && !event.target.matches('.dropbtn i')) {
          var dropdowns = document.getElementsByClassName("dropdown-content");
          var sections = document.getElementsByClassName("chat_section");
          for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            var section = sections[i];
            if (openDropdown.classList.contains('show')) {
              openDropdown.classList.remove('show');
              section.classList.remove('show_section');
              section.querySelector('.dropbtn').style.display='none';
            }
          }
        }
        if(!event.target.matches('.logout_button') && !event.target.matches('.sidebar__footer-user_logo') && !event.target.matches('.sidebar__footer-user_name') && !event.target.matches('.sidebar__footer-user')){
            document.querySelector('.logout_dropdown').classList.remove('show');
        }
    }

    // SHOW/HIDE SIDEBAR
    let arrow = document.querySelector('.arrow div');
    function toggleSidebar() {
        if (sidebar.classList.contains('hidden')) {
            sidebar.classList.remove('hidden');
            arrow.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        } else {
            sidebar.classList.add('hidden');
            arrow.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        }
    }
    if (window.innerWidth >= 800) {
        sidebar.classList.remove('hidden');
        arrow.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    } else {
        sidebar.classList.add('hidden');
        arrow.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    }
    arrow.addEventListener('click', toggleSidebar);
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 800) {
            sidebar.classList.remove('hidden');
            arrow.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        } else {
            sidebar.classList.add('hidden');
            arrow.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        }
    });

    let grid_div = document.querySelectorAll('.content__footer-grid_div');
    grid_div.forEach(grid_element=>{
        let grid_i= grid_element.querySelector('i');
        grid_element.addEventListener('mouseenter',()=>{
            grid_i.style.display="block";
        });
        grid_element.addEventListener('mouseleave',()=>{
            grid_i.style.display="none";
        });
        grid_element.addEventListener('click',()=>{
            let string1 = grid_element.querySelector('.content__footer-grid_div-1').innerHTML;
            let string2 = grid_element.querySelector('.content__footer-grid_div-2').innerHTML;
            message.value = string1+" " +string2;
            message_i.click();
        });
    });
});