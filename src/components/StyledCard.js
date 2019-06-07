import styled from 'styled-components';
import {Card} from 'rimble-ui';

const StyledCard = styled(Card).attrs(()=>({
  my: 0,
  p: 3
}))`
  border-radius: 4px;
  @media screen and (max-width: 480px){
    border-radius: 0;
  }
`;

export default StyledCard;
