import showImageCss from './positionSelect.module.css'

export const positionSelect = ({selectEmployee, pdfRef, employee, pageWidth, pageHeight}) => {
    const element = selectEmployee.current;
    const imageDimentions = pdfRef.current.getBoundingClientRect();

    const porX = (employee.x / pageWidth) * 100;
    const porY = (employee.y / pageHeight) * 100;
    const porHeight = (employee.height / pageWidth) * 100;
    const porWidth = (employee.width / pageHeight) * 100;

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