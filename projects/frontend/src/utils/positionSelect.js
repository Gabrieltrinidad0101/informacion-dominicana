import showImageCss from './positionSelect.module.css'

export const positionSelect = (selectEmployee, imageRef, employee) => {
    const element = selectEmployee.current;
    const imageDimentions = imageRef.current.getBoundingClientRect();

    const porX = (employee.x / 2000) * 100;
    const porY = (employee.y / 2000) * 100;
    const porHeight = (employee.height / 2000) * 100;
    const porWidth = (employee.width / 2000) * 100;

    const positionX = imageDimentions.width * (porX / 100);
    const positionY = imageDimentions.height * (porY / 100);
    const width = imageDimentions.width * (porWidth / 100);
    const height = imageDimentions.height * (porHeight / 100);

    element.style.left = `${positionX}px`;
    element.style.top = `${positionY}px`;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.classList.remove(showImageCss.selecteEmployeeOpacity);
    element.classList.add(showImageCss.selecteEmployee);
}